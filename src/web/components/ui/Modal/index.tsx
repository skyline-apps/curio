import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalProps,
} from "@heroui/modal";

interface CurioModalProps extends ModalProps {}

const CurioModal: React.FC<CurioModalProps> = ({
  children,
  ...props
}: CurioModalProps) => {
  return (
    <Modal
      classNames={{
        backdrop: "backdrop-opacity-80 backdrop-brightness-50 backdrop-blur-sm",
        base: "rounded max-h-[90vh] my-4",
        wrapper: "overflow-y-auto py-4 items-center",
        body: "pb-4",
        closeButton: "hover:bg-background active:bg-background",
      }}
      {...props}
    >
      {children}
    </Modal>
  );
};

export default CurioModal;
export { ModalBody, ModalContent, ModalFooter, ModalHeader };
