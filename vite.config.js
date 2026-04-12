import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Validação de segurança: Impede builds para produção caso as credenciais não estejam presentes
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    console.warn('\n⚠️ [AVISO DE SEGURANÇA]: Variáveis de ambiente do Supabase ausentes no momento do build/load.\n');
    // Em pipelines CI (production), isso fará o build quebrar propositalmente se faltar as keys.
    if (mode === 'production') {
      throw new Error('As credenciais VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são rigorosamente necessárias para o build.');
    }
  }

  return {
    root: 'src',
    envDir: '../',
    publicDir: '../public',
    base: '/atividade-avaliativa-qualidade-de-software/',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});
