import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/features/slices/authSlice";

export const useCurrentUserId = () => {
  const user = useSelector(selectCurrentUser);
  return user?.id;
};
