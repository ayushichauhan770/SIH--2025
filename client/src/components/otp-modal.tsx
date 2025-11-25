import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OTPModalProps {
  open: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<boolean>;
  phone: string;
  purpose: string;
}

export function OTPModal({ open, onClose, onVerify, phone, purpose }: OTPModalProps) {
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
      setOtp("");
    }
  };

  useEffect(() => {
    if (!open) return;
    // start cooldown when modal opens (assume OTP already sent)
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
      await apiRequest("POST", "/api/otp/generate", { phone, purpose });
      toast({ title: "OTP Resent", description: "A new code was sent to your phone." });
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
      toast({ title: "Resend Failed", description: err?.message || "Could not resend OTP", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-otp">
        <DialogHeader>
          <DialogTitle>Verify OTP</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code sent to {phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            data-testid="input-otp"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <div className="flex flex-col gap-3 w-full">
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={onClose} className="flex-1" data-testid="button-cancel-otp">
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={otp.length !== 6 || isVerifying}
                className="flex-1"
                data-testid="button-verify-otp"
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>Didn't receive it?</div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleResend} disabled={resendCooldown > 0} data-testid="button-resend-otp">
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
