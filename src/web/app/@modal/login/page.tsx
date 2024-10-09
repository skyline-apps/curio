"use client";

import { useRouter } from "next/navigation";
import React from "react";

import GoogleSignIn from "@/components/GoogleSignIn";
import Modal, {
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@/components/Modal";

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
          <h1 className="text-2xl font-medium">Log in</h1>
        </ModalHeader>
        <ModalBody>
          <GoogleSignIn nextUrl="/home" />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default LoginPage;
