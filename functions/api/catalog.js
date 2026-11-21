export const CATALOGO_YCR = {
  config: {
    marca: "YCR Estética",
    marca_sub: "Piel Sana",
    nombre_app: "Tu piel, en una foto",
    nombre_profesional: "Yolyma",
    nombre_completo: "Yolyma Rodriguez",
    instagram: "ycr.estetica",
    whatsapp: "5491100000000",
    credenciales: [
      "YCR Estética · Piel Sana",
      "Especialistas en cuidado de la piel · Buenos Aires"
    ],
    pais: "AR",
    ia_plan_pago: false
  },
  tratamientos: [
    "Limpieza Facial Profunda con extracciones y mascarilla personalizada",
    "Peeling Químico Renovador (manchas, textura y luminosidad)",
    "Dermaplaning + Hidratación Profunda",
    "Radiofrecuencia Facial (firmeza y líneas de expresión)",
    "Microneedling / Dermapen con activos específicos",
    "Shock de Hidratación y Luminosidad (Vitamina C + Ácido Hialurónico)",
    "Protocolo Seborregulador y Anti-Acné",
    "Protocolo Descongestivo para Pieles Sensibles / Rosácea"
  ],
  tratamientos_premium: [
    "Bioestimulación Facial / Protocolo Intensivo Anti-Age",
    "Protocolo Combinado Renovación Total (Peeling + Dermapen + LED)"
  ],
  productos: [
    "Gel o espuma de limpieza suave",
    "Sérum de Vitamina C antioxidante",
    "Sérum de Niacinamida (poros, sebo y tono uniforme)",
    "Sérum de Ácido Hialurónico hidratante",
    "Crema hidratante reparadora de barrera",
    "Protector solar FPS 50+ toque seco"
  ]
};

export async function onRequestGet() {
  return Response.json(
    { config: CATALOGO_YCR.config },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
