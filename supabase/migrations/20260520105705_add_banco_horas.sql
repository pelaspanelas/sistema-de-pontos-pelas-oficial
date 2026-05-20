ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banco_horas_ativo BOOLEAN NOT NULL DEFAULT false;
