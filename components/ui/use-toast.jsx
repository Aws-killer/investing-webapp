// components/ui/use-toast.ts
import * as React from "react";
import { toast as sonnerToast } from "sonner";

/** A fully custom toast that still maintains the animations and interactions. */
function Toast(props) {
  const { title, description, button, id } = props;

  return sonnerToast.custom((id) => (
    <div className="flex rounded-lg bg-white shadow-lg ring-1 ring-black/5 w-full md:max-w-[364px] items-center p-4">
      <div className="flex flex-1 items-center">
        <div className="w-full">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  ));
}

export function useToast() {
  console.log("useToast hook called");
  return { toast: Toast };
}
