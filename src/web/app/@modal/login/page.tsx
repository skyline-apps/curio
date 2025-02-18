"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { CurioName } from "@/components/CurioBrand";
import GoogleSignIn from "@/components/GoogleSignIn";
import Modal, {
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@/components/ui/Modal";
import YarnDark from "@/public/assets/yarn_dark.svg";
import YarnLight from "@/public/assets/yarn_light.svg";

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = ({}: LoginPageProps) => {
  const router = useRouter();
  const onClose = (): void => router.push("/");

  return (
    <Modal
      defaultOpen
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader>
          <div className="w-full flex items-center justify-center">
            <CurioName className="h-12" />
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center gap-4">
            <YarnLight className="w-24 h-24 mb-4 block dark:hidden" />
            <YarnDark className="w-24 h-24 mb-4 block hidden dark:block" />
            <GoogleSignIn nextUrl="/home" />
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default LoginPage;
