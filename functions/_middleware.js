export async function onRequest(context){
  /* Site ka asli pata www.karakoramvision.com hai. Jo seedha production
     wale pages.dev par aaye, use wahan bhej dete hain — taake ek hi pata
     rahe aur search engines ko shak na ho.
     Preview ke pate (<hash>.karakoram-vision-pakistan.pages.dev) is se
     bache rehte hain, kyunki unka host alag hota hai. */
  const url = new URL(context.request.url);
  if (url.hostname === 'karakoram-vision-pakistan-6od.pages.dev') {
    return Response.redirect('https://www.karakoramvision.com' + url.pathname + url.search, 301);
  }

  const response=await context.next();const headers=new Headers(response.headers);
  headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');headers.set('X-Frame-Options','SAMEORIGIN');headers.set('Cross-Origin-Opener-Policy','same-origin-allow-popups');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
