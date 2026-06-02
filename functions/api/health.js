export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      code: 200,
      msg: "OK",
      data: { status: "healthy", timestamp: Date.now() },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}