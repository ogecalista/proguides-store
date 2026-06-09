// ── PROGUIDES AUTH GUARD ─────────────────────────────────
// Include this script at the TOP of any page that requires login
// Usage: <script src="../auth-guard.js"></script>
// For admin pages: <script>const REQUIRE_ADMIN = true;</script> before including this

(async function() {
  const SUPABASE_URL  = 'https://jomsflisyeohejfrvxnf.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXNmbGlzeWVvaGVqZnJ2eG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MTY5MTIsImV4cCI6MjA5NjE5MjkxMn0.qaC_PbEIfHJq4ae9gRJxcUV-fgwrXTMEldO6yj66KNY';
  const ADMIN_EMAIL   = 'proguidesstore@gmail.com';

  // Load Supabase if not already loaded
  if (!window.supabase) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  const { data: { session } } = await db.auth.getSession();

  const isAdminPage = typeof REQUIRE_ADMIN !== 'undefined' && REQUIRE_ADMIN === true;

  if (!session) {
    // Not logged in — redirect to login
    const loginPage = isAdminPage ? '/admin-login.html' : '/vendor/login.html';
    window.location.href = loginPage;
    return;
  }

  if (isAdminPage) {
    // Admin check
    if (session.user.email !== ADMIN_EMAIL) {
      await db.auth.signOut();
      window.location.href = '/vendor/login.html';
      return;
    }
    window.PROGUIDES_ADMIN = true;
    window.PROGUIDES_SESSION = session;
  } else {
    // Vendor check — block admin from vendor pages
    if (session.user.email === ADMIN_EMAIL) {
      window.location.href = '/admin.html';
      return;
    }

    // Load vendor profile
    const { data: vendor } = await db
      .from('vendors')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!vendor || !vendor.is_approved) {
      await db.auth.signOut();
      localStorage.removeItem('proguides_vendor');
      window.location.href = '/vendor/login.html';
      return;
    }

    // Keep localStorage in sync
    localStorage.setItem('proguides_vendor', JSON.stringify(vendor));
    window.PROGUIDES_VENDOR = vendor;
    window.PROGUIDES_SESSION = session;
  }
})();
