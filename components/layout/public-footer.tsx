export function PublicFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} Zarvis. All rights reserved.
    </footer>
  );
}
