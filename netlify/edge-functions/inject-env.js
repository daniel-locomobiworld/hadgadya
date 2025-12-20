// Netlify Edge Function to inject Supabase environment variables
export default async (request, context) => {
  const response = await context.next();
  
  // Only process HTML responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }
  
  let html = await response.text();
  
  // Get env vars
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  
  // Log for debugging
  console.log('Edge function running, SUPABASE_URL exists:', !!supabaseUrl);
  
  // Inject Supabase config before other scripts
  const supabaseConfig = `
    <script>
      window.SUPABASE_URL = '${supabaseUrl}';
      window.SUPABASE_ANON_KEY = '${supabaseKey}';
      console.log('Supabase config injected:', !!window.SUPABASE_URL);
    </script>
  `;
  
  // Insert before closing head tag
  html = html.replace('</head>', `${supabaseConfig}</head>`);
  
  return new Response(html, {
    headers: response.headers
  });
};
