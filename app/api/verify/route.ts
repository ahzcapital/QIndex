import {NextResponse} from "next/server";
function privateHost(h:string){const x=h.toLowerCase();return x==="localhost"||x==="127.0.0.1"||x==="::1"||x.startsWith("10.")||x.startsWith("192.168.")||x.startsWith("169.254.")||x.endsWith(".local")}
export async function POST(request:Request){
 try{
  const body=await request.json(); const raw=typeof body?.url==="string"?body.url.trim():"";
  if(!raw)return NextResponse.json({message:"A project URL is required."},{status:400});
  let current=new URL(raw); if(!["http:","https:"].includes(current.protocol))return NextResponse.json({message:"Only HTTP and HTTPS URLs are supported."},{status:400});
  if(privateHost(current.hostname))return NextResponse.json({message:"Private or local network addresses are not allowed."},{status:400});
  const started=Date.now(); let response:Response|null=null;
  for(let i=0;i<6;i++){
   response=await fetch(current,{method:"GET",redirect:"manual",cache:"no-store",headers:{"User-Agent":"QIndexVerifier/0.1"},signal:AbortSignal.timeout(8000)});
   if(![301,302,303,307,308].includes(response.status))break;
   const location=response.headers.get("location"); if(!location)break; current=new URL(location,current);
   if(privateHost(current.hostname))return NextResponse.json({message:"Redirected to a private or local address."},{status:400});
  }
  if(!response)throw new Error("No response received.");
  const host=current.hostname.toLowerCase(); const verified=host.endsWith(".qstorage.quilibrium.com");
  return NextResponse.json({verified,status:response.status,responseTimeMs:Date.now()-started,finalUrl:current.toString(),hosting:verified?"QStorage":null});
 }catch(error){return NextResponse.json({message:"QIndex could not reach this URL. "+(error instanceof Error?error.message:"Unknown error")},{status:400})}
}