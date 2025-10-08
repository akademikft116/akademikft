<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const SUPABASE_URL = "https://bnslruddgegoeexbjwgr.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc2xydWRkZ2Vnb2VleGJqd2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODkyMTMsImV4cCI6MjA3NTQ2NTIxM30.V50LK0cosSOdZEpU96A5CM41vzapQJoB1MvJkPQE03o";
  const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("Login gagal: " + error.message);
    } else {
      window.location.href = "main.html";
    }
  }

  async function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("Gagal daftar: " + error.message);
    else alert("Pendaftaran berhasil, silakan login!");
  }
</script>
