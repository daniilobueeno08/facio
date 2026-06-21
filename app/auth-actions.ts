"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizePhone, isValidEmail, isValidWhatsapp } from "@/lib/validation";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const email    = formData.get("email")    as string;
  const password = formData.get("password") as string;
  const nome     = formData.get("nome")     as string;
  const whatsapp = formData.get("whatsapp") as string;
  const razaoSocial = (formData.get("razao_social") as string)?.trim() ?? "";
  const normalizedWhatsapp = normalizePhone(whatsapp);

  if (!email || !password || !nome || !whatsapp) {
    return { error: "Preencha todos os campos." };
  }
  if (!isValidEmail(email)) {
    return { error: "E-mail inválido." };
  }
  if (password.length < 6) {
    return { error: "A senha precisa ter no mínimo 6 caracteres." };
  }
  if (!isValidWhatsapp(whatsapp)) {
    return { error: "WhatsApp inválido." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome, whatsapp: normalizedWhatsapp, razao_social: razaoSocial } }, // alimenta o trigger handle_new_user()
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { error: "Este e-mail já está cadastrado. Verifique sua caixa de entrada para confirmar a conta, ou faça login." };
    }
    return { error: `Não foi possível criar a conta: ${error.message}` };
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const email    = formData.get("email")    as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }
  if (!isValidEmail(email)) {
    return { error: "E-mail inválido." };
  }
  if (password.length < 6) {
    return { error: "A senha precisa ter no mínimo 6 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("confirm")) {
      return { error: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada." };
    }
    return { error: "E-mail ou senha incorretos." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
