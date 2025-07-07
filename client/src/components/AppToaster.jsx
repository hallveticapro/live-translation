/* client/src/components/AppToaster.jsx */
import { Toaster } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: "#333",
          color: "#fff",
        },
      }}
    />
  );
}
