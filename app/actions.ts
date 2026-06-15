"use server";

export async function submitLead(formData: FormData) {
  const whatsapp = formData.get("whatsapp") as string;
  const email    = formData.get("email")    as string;

  if (!whatsapp || !email) {
    return { success: false, error: "Preencha todos os campos." };
  }

  const phone = whatsapp.replace(/\D/g, "");
  if (phone.length < 10) {
    return { success: false, error: "WhatsApp inválido." };
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (url && key) {
      await fetch(`${url}/rest/v1/leads`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        key,
          "Authorization": `Bearer ${key}`,
          "Prefer":        "return=minimal",
        },
        body: JSON.stringify({ email, whatsapp: phone, created_at: new Date().toISOString() }),
      });
    }

    return { success: true };
  } catch {
    return { success: true }; // não bloquear o lead por erro de infra
  }
}
