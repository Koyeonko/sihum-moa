const SUPABASE_URL = "https://sctbqvelpkmwfavreuss.supabase.co";
const SUPABASE_KEY = "sb_publishable_gDZC0ObmFQlL9ysHxqMp0A_Eh0iyOb-";

window.examDb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
