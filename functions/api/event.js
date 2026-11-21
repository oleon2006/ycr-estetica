export async function onRequestPost({ request }) {
  try {
    const ev = await request.json();
    console.log("[YCR event]", ev?.tipo, ev?.origen || "");
  } catch {}
  return new Response(null, { status: 204 });
}
