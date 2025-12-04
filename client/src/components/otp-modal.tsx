import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, RefreshCw } from "lucide-react";

interface OTPModalProps {
  open: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<boolean>;
  phone?: string;
  email?: string;
  purpose: string;
}

export function OTPModal({ open, onClose, onVerify, phone, email, purpose }: OTPModalProps) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<number | null>(null);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter all 6 digits",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    const success = await onVerify(otp);
    setIsVerifying(false);

    if (success) {
      toast({
        title: "Verified!",
        description: "OTP verified successfully",
      });
      setOtp("");
      onClose();
    } else {
      toast({
        title: "Verification Failed",
        description: "Invalid or expired OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  // start cooldown when modal opens (assume OTP already sent)
  useEffect(() => {
    if (!open) return;
    setResendCooldown(30);
    if (cooldownRef.current) window.clearInterval(cooldownRef.current);
    cooldownRef.current = window.setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) window.clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000) as unknown as number;

    return () => {
      if (cooldownRef.current) window.clearInterval(cooldownRef.current);
      cooldownRef.current = null;
    };
  }, [open]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      console.log("[OTP Modal] Resending OTP with:", { phone, email, purpose });
      const response = await apiRequest<{ message: string; otp?: string }>("POST", "/api/otp/generate", { phone, email, purpose });
      console.log("[OTP Modal] Resend response:", response);
      
      // Expose OTP in development mode
      if (response.otp) {
        (window as any).LAST_OTP = response.otp;
        console.log("🔄 NEW OTP generated for testing:", response.otp);
      }
      
      toast({ 
        title: "OTP Resent", 
        description: `A new code was sent to your ${email ? "email" : "phone"}.${response.otp ? ` (Dev: ${response.otp})` : ''}` 
      });
      
      setResendCooldown(30);
      if (cooldownRef.current) window.clearInterval(cooldownRef.current);
      cooldownRef.current = window.setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) {
            if (cooldownRef.current) window.clearInterval(cooldownRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000) as unknown as number;
    } catch (err: any) {
      console.error("[OTP Modal] Resend error:", err);
      toast({ 
        title: "Resend Failed", 
        description: err?.message || "Could not resend OTP", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[400px] p-0 border-0 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden font-['Outfit',sans-serif]"
        data-testid="modal-otp"
      >
        <div className="flex flex-col items-center pt-10 pb-8 px-6 text-center">
           <div className="h-20 w-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#0071e3] mb-6 animate-in zoom-in duration-500">
              <ShieldCheck size={40} />
           </div>
           
           <DialogHeader className="mb-6">
             <DialogTitle className="text-2xl font-bold text-[#1d1d1f] dark:text-white mb-2">Verify Identity</DialogTitle>
             <DialogDescription className="text-[#86868b] text-base">
               Enter the 6-digit code sent to<br/>
               <span className="font-semibold text-[#1d1d1f] dark:text-white">
                 {email ? email : phone?.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")}
               </span>
             </DialogDescription>
           </DialogHeader>

           <div className="w-full space-y-8">
             <div className="flex justify-center">
               <InputOTP
                 maxLength={6}
                 value={otp}
                 onChange={setOtp}
                 data-testid="input-otp"
               >
                 <InputOTPGroup className="gap-2">
                   {[0, 1, 2, 3, 4, 5].map((index) => (
                     <InputOTPSlot 
                        key={index} 
                        index={index} 
                        className="h-12 w-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F5F5F7] dark:bg-slate-800 text-lg font-bold ring-offset-white dark:ring-offset-slate-950 focus:ring-2 focus:ring-[#0071e3] focus:border-[#0071e3] transition-all"
                     />
                   ))}
                 </InputOTPGroup>
               </InputOTP>
             </div>

             <div className="space-y-4">
               <Button
                 onClick={handleVerify}
                 disabled={otp.length !== 6 || isVerifying}
                 className="w-full h-12 rounded-full bg-[#0071e3] hover:bg-[#0077ED] text-white font-semibold text-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                 data-testid="button-verify-otp"
               >
                 {isVerifying ? "Verifying..." : "Verify Code"}
               </Button>
               
               <Button 
                  variant="ghost" 
                  onClick={handleResend} 
                  disabled={resendCooldown > 0} 
                  className="w-full h-10 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white"
                  data-testid="button-resend-otp"
               >
                 {resendCooldown > 0 ? (
                    <span className="flex items-center gap-2">
                       <RefreshCw className="h-4 w-4 animate-spin" /> Resend in {resendCooldown}s
                    </span>
                 ) : (
                    "Resend Code"
                 )}
               </Button>
             </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
