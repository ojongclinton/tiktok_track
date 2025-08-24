import { toast } from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";
import { colorSystem } from "../../utils/constants";

type ToastType = "success" | "error" | "warning" | "info" | "danger";

interface CustomToastProps {
  t: any;
  type?: ToastType;
  title: string;
  message: string;
  avatar?: string;
  loading?: boolean;
}

export function CustomToast({
  t,
  type = "info",
  title,
  message,
  avatar,
  loading = false,
}: CustomToastProps) {
  // Map type -> theme color
  const typeStyles: Record<ToastType, string> = {
    success: colorSystem.success,
    error: colorSystem.accent,
    warning: colorSystem.warning,
    info: colorSystem.primary,
    danger: colorSystem.danger,
  };

  return (
    <div
      className={`${
        t.visible ? "animate-custom-enter" : "animate-custom-leave"
      } max-w-lg w-full shadow-lg rounded-lg pointer-events-auto flex ring-1`}
      style={{
        backgroundColor: colorSystem.surface,
        borderColor: colorSystem.border,
      }}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          {avatar && (
            <div className="flex-shrink-0 pt-0.5">
              <img
                className="h-10 w-10 rounded-full"
                src={avatar}
                alt="avatar"
              />
            </div>
          )}
          <div className="ml-3 flex-1">
            <div className="flex items-center gap-2">
              <p
                className="text-sm font-medium"
                style={{ color: typeStyles[type] }}
              >
                {title}
              </p>
              {loading && (
                <CgSpinner
                  className="animate-spin w-4 h-4"
                  style={{ color: typeStyles[type] }}
                />
              )}
            </div>
            <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
              {message}
            </p>
          </div>
        </div>
      </div>
      <div
        className="flex border-l"
        style={{ borderColor: colorSystem.border }}
      >
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium focus:outline-none"
          style={{ color: colorSystem.primary }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// -----------------------------
// showToast helper
// -----------------------------

interface ShowToastOptions {
  type?: ToastType;
  title: string;
  message: string;
  avatar?: string;
  loading?: boolean;
}

// export const showToast = ({
//   type = "info",
//   title,
//   message,
//   avatar,
//   loading = false,
// }: ShowToastOptions) => {
//   toast.custom((t) => (
//     <CustomToast
//       t={t}
//       type={type}
//       title={title}
//       message={message}
//       avatar={avatar}
//       loading={loading}
//     />
//   ));
// };

export const showToast = ({
  type = "info",
  title,
  message,
  avatar,
  loading = false,
}: ShowToastOptions) => {
  return toast.custom((t) => (
    <CustomToast
      t={t}
      type={type}
      title={title}
      message={message}
      avatar={avatar}
      loading={loading}
    />
  ));
};
