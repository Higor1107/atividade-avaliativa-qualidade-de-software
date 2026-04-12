-- [PATCH SEC-001] Execute no Supabase para fechar a brecha de segurança no RPC (IDOR)
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
