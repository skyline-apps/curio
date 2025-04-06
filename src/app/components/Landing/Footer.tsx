const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-8 text-secondary-700 bg-background-600">
      <div className="flex justify-between items-end mx-auto px-4 md:px-16">
        <div>
          <p className="text-left text-xs">
            Curio © {new Date().getFullYear()}
          </p>
          <p className="text-left text-xs">
            <a
              href="https://kimberli.me"
              target="_blank"
              rel="me"
              className="hover:text-secondary-800"
            >
              About me
            </a>
          </p>
          <p className="text-left text-xs">
            <a href="mailto:team@curi.ooo" className="hover:text-secondary-800">
              Contact us
            </a>
          </p>
        </div>
        <div>
          <p className="text-right text-xs">
            <a
              href="https://github.com/kimberli/curio"
              target="_blank"
              rel="noreferrer"
              className="hover:text-secondary-800"
            >
              We&rsquo;re open source!
            </a>
          </p>
          <p className="text-right text-xs">
            <a
              href="https://status.curi.ooo"
              target="_blank"
              rel="noreferrer"
              className="hover:text-secondary-800"
            >
              Status page
            </a>
          </p>
          <p className="text-right text-xs">
            <a href="/privacy" className="hover:text-secondary-800">
              Privacy policy
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
