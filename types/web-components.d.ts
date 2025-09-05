declare namespace JSX {
  interface IntrinsicElements {
    'badge-component': {
      variant?: 'default' | 'secondary' | 'destructive' | 'outline';
      children?: React.ReactNode;
    };
  }
}