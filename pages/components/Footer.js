export default function Footer() {
  return (
    <footer>
      <div className='absolute bottom-0 left-0 right-0 bg-lime-500'>
        <p>
          <strong>EZUPS</strong> by{' '}
          <a href='https://github.com/c4lyp5o'>
            {process.env.NEXT_PUBLIC_YOURNAME}
          </a>
        </p>
      </div>
    </footer>
  );
}
