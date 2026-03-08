import logo from '@/assets/logo.png';

const PageLoader = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
    <img src={logo} alt="ChatBot Studio" className="h-12 w-12 animate-pulse" />
    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
  </div>
);

export default PageLoader;
