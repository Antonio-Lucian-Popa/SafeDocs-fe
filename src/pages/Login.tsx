import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/app/AuthContext';
import { toast } from 'sonner';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (parent: Element, config: any) => void;
        };
      };
    };
  }
}

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  useEffect(() => {
    if (!window.google) {
      console.error('Google Identity Services not loaded');
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    console.log("jsdh ", clientId)
    if (!clientId) {
      console.error('Google Client ID not configured');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: false,
    });

    // Render the button
    const buttonDiv = document.getElementById('google-signin-button');
    if (buttonDiv) {
      window.google.accounts.id.renderButton(buttonDiv, {
        theme: 'outline',
        size: 'large',
        width: 300,
        logo_alignment: 'left',
      });
    }
  }, []);

  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      toast.error('No credential received from Google');
      return;
    }

    setIsLoading(true);
    try {
      await login(response.credential);
      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">SafeDocs</CardTitle>
            <CardDescription className="text-base">
              Secure document management made simple
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground">
            Sign in with your Google account to access your documents securely.
          </div>

          <div className="space-y-4">
            <div id="google-signin-button" className="flex justify-center" />
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Continue with Google'
              )}
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            Your documents are encrypted and secure.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}