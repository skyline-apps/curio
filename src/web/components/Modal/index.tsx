import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalProps,
} from "@nextui-org/modal";

interface CurioModalProps extends ModalProps {}

const CurioModal: React.FC<CurioModalProps> = ({
  children,
  ...props
}: CurioModalProps) => {
  return (
    <Modal
      classNames={{
        backdrop: "backdrop-opacity-80 backdrop-brightness-50 backdrop-blur-sm	",
        base: "rounded",
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
