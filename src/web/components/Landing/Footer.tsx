const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-8 text-secondary-700 bg-background-600">
      <div className="flex justify-between items-end mx-auto px-4 md:px-16">
        <div>
          <p className="text-left text-sm">
            Curio © {new Date().getFullYear()}
          </p>
          <p className="text-left text-sm">
            <a href="https://kimberli.me" target="_blank" rel="me">
              About me
            </a>
          </p>
        </div>
        <div>
          <p className="text-right text-sm">
            <a
              href="https://github.com/kimberli/curio"
              target="_blank"
              rel="noreferrer"
            >
              We&rsquo;re open source!
            </a>
          </p>
          <p className="text-right text-sm">
            <a href="/privacy">Privacy policy</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
