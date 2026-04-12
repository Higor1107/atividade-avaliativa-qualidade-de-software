-- ══════════════════════════════════════════
-- AgendaFácil — Setup do Banco de Dados (Supabase)
-- Execute este SQL no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/wstxwsdgftpovnztpzus/sql/new
-- ══════════════════════════════════════════

-- 1. Tabela de perfis (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('developer', 'establishment', 'visitor')),
  city TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver todos os perfis" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários podem editar seu próprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 2. Tabela de estabelecimentos
CREATE TABLE IF NOT EXISTS public.establishments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  category TEXT DEFAULT '',
  services JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver estabelecimentos" ON public.establishments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Dono pode inserir estabelecimento" ON public.establishments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Dono pode editar estabelecimento" ON public.establishments
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Dono pode deletar estabelecimento" ON public.establishments
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 3. Tabela de time slots
CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver time slots" ON public.time_slots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Dono do estab. pode inserir slots" ON public.time_slots
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.establishments
      WHERE id = establishment_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Dono do estab. pode editar slots" ON public.time_slots
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.establishments
      WHERE id = establishment_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Dono do estab. pode deletar slots" ON public.time_slots
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.establishments
      WHERE id = establishment_id AND owner_id = auth.uid()
    )
  );

-- Nota: updates de is_available são feitos via RPC book_appointment (seguro)

-- 4. Tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  time_slot_id UUID REFERENCES public.time_slots(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  service_type TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitante pode ver seus agendamentos" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    auth.uid() = visitor_id
    OR EXISTS (
      SELECT 1 FROM public.establishments
      WHERE id = establishment_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Visitante pode criar agendamento" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = visitor_id);

-- Visitante só pode cancelar seus próprios agendamentos
CREATE POLICY "Visitante pode cancelar seu agendamento" ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = visitor_id)
  WITH CHECK (auth.uid() = visitor_id);

-- Dono do estabelecimento pode confirmar/completar agendamentos
CREATE POLICY "Dono estab. pode gerenciar agendamentos" ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.establishments
      WHERE id = establishment_id AND owner_id = auth.uid()
    )
  );

-- 5. Tabela de registros visitante-estabelecimento
CREATE TABLE IF NOT EXISTS public.visitor_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (visitor_id, establishment_id)
);

ALTER TABLE public.visitor_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver registros" ON public.visitor_registrations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Dono estab. pode registrar visitante" ON public.visitor_registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.establishments
      WHERE id = establishment_id AND owner_id = auth.uid()
    )
  );

-- 6. Trigger para auto-criar perfil ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, city, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'visitor'),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger se já existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RPC para agendamento atômico (evita race conditions)
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_visitor_id UUID,
  p_establishment_id UUID,
  p_time_slot_id UUID,
  p_status TEXT DEFAULT 'pending',
  p_notes TEXT DEFAULT '',
  p_service_type TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
  v_appointment RECORD;
  v_available BOOLEAN;
BEGIN
  -- Validação de segurança: garante que o visitante é o usuário autenticado
  IF p_visitor_id <> auth.uid() THEN
    RAISE EXCEPTION 'Operação não autorizada';
  END IF;

  -- Verifica se o slot está disponível (com lock)
  SELECT is_available INTO v_available
  FROM public.time_slots
  WHERE id = p_time_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Horário não encontrado';
  END IF;

  IF NOT v_available THEN
    RAISE EXCEPTION 'Horário já está ocupado';
  END IF;

  -- Marca slot como indisponível
  UPDATE public.time_slots SET is_available = false WHERE id = p_time_slot_id;

  -- Cria o agendamento
  INSERT INTO public.appointments (visitor_id, establishment_id, time_slot_id, status, notes, service_type)
  VALUES (p_visitor_id, p_establishment_id, p_time_slot_id, p_status, p_notes, p_service_type)
  RETURNING * INTO v_appointment;

  RETURN to_jsonb(v_appointment);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_establishments_city ON public.establishments(city);
CREATE INDEX IF NOT EXISTS idx_establishments_owner ON public.establishments(owner_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_establishment_date ON public.time_slots(establishment_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_appointments_visitor ON public.appointments(visitor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_establishment ON public.appointments(establishment_id);
