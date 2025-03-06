import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConsentFormProps = {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export function ConsentForm({ open, onAccept, onDecline }: ConsentFormProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Privacy Notice & Consent</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              During this assessment, IntegrityGuard will collect the following behavioral data:
            </p>
            <ul className="list-disc pl-6">
              <li>Window focus and tab switching events</li>
              <li>Mouse movement patterns</li>
              <li>Basic keyboard activity patterns</li>
            </ul>
            <p>
              This data is used only for maintaining assessment integrity and will be:
            </p>
            <ul className="list-disc pl-6">
              <li>Collected only during the assessment duration</li>
              <li>Used solely for detecting potential academic integrity violations</li>
              <li>Stored securely and deleted after assessment review</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDecline}>Decline</AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>Accept & Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
