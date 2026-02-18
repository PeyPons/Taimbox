// Edge Function: añadir administrador de plataforma por email.
// Si se envía contraseña: crea el usuario en Auth (si no existe) y lo añade a platform_admins.
// Si no se envía contraseña: el usuario debe existir en Auth; se busca y se añade a platform_admins.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_PASSWORD_LENGTH = 6;

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Configuración del servidor incompleta" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    let body: { email?: string; role?: string; password?: string; name?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Formato de datos inválido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return new Response(
        JSON.stringify({ error: "El email es obligatorio" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (password && password.length < MIN_PASSWORD_LENGTH) {
      return new Response(
        JSON.stringify({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó autorización" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: isAdmin, error: rpcError } = await supabaseAnon.rpc("is_platform_admin");
    if (rpcError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Solo administradores de plataforma pueden añadir otros administradores" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const role = typeof body.role === "string" && body.role.trim() ? body.role.trim() : "admin";

    let userId: string;

    if (password) {
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name || email },
      });
      if (createError) {
        const isAlreadyRegistered =
          createError.message?.includes("already") ||
          createError.message?.toLowerCase().includes("already registered");
        if (isAlreadyRegistered) {
          const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });
          if (listError) {
            return new Response(
              JSON.stringify({ error: "Error al buscar usuario existente" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
            );
          }
          const existing = listData?.users?.find((u) => u.email?.toLowerCase() === email);
          if (!existing?.id) {
            return new Response(
              JSON.stringify({ error: "El email ya está registrado. No se pudo localizar al usuario." }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
          }
          userId = existing.id;
        } else {
          return new Response(
            JSON.stringify({ error: createError.message || "Error al crear el usuario" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
      } else {
        userId = createData.user?.id ?? "";
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "No se recibió el ID del usuario creado" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
      }
    } else {
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (listError) {
        console.error("listUsers error:", listError);
        return new Response(
          JSON.stringify({ error: "Error al buscar usuarios" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      const user = listData?.users?.find((u) => u.email?.toLowerCase() === email);
      if (!user?.id) {
        return new Response(
          JSON.stringify({
            error: `No existe ningún usuario con el email "${email}". Indica una contraseña para crear la cuenta o pide que se registre antes.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      userId = user.id;
    }

    const { error: insertError } = await supabaseAdmin
      .from("platform_admins")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" });

    if (insertError) {
      console.error("Insert platform_admins error:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message || "Error al añadir administrador" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    console.error("add-platform-admin error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error inesperado" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}

// Algunos runtimes self-hosted buscan default export; serve() es el estándar Supabase Cloud.
export default handler;
serve(handler);
