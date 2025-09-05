import { LitElement, html, css } from 'lit';

export class BadgeComponent extends LitElement {
  static properties = {
    variant: { type: String }
  };

  variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      border: 1px solid;
      padding: 0.125rem 0.625rem;
      font-size: 0.75rem;
      line-height: 1rem;
      font-weight: 600;
      transition: colors 0.2s;
      white-space: nowrap;
      outline: none;
      focus-visible: outline 2px solid;
      focus-visible: outline-offset 2px;
    }

    :host([variant="default"]) {
      border-color: transparent;
      background-color: hsl(222.2 84% 4.9%);
      color: hsl(210 40% 98%);
    }

    :host([variant="default"]:hover) {
      background-color: hsl(222.2 84% 4.9% / 0.8);
    }

    :host([variant="secondary"]) {
      border-color: transparent;
      background-color: hsl(210 40% 96%);
      color: hsl(222.2 84% 4.9%);
    }

    :host([variant="secondary"]:hover) {
      background-color: hsl(210 40% 96% / 0.8);
    }

    :host([variant="destructive"]) {
      border-color: transparent;
      background-color: hsl(0 84.2% 60.2%);
      color: hsl(210 40% 98%);
    }

    :host([variant="destructive"]:hover) {
      background-color: hsl(0 84.2% 60.2% / 0.9);
    }

    :host([variant="outline"]) {
      border-color: hsl(214.3 31.8% 91.4%);
      background-color: hsl(0 0% 100%);
      color: hsl(222.2 84% 4.9%);
    }

    :host([variant="outline"]:hover) {
      background-color: hsl(210 40% 96%);
      color: hsl(222.2 84% 4.9%);
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      :host([variant="default"]) {
        background-color: hsl(210 40% 98%);
        color: hsl(222.2 84% 4.9%);
      }

      :host([variant="secondary"]) {
        background-color: hsl(217.2 32.6% 17.5%);
        color: hsl(210 40% 98%);
      }

      :host([variant="outline"]) {
        border-color: hsl(217.2 32.6% 17.5%);
        background-color: hsl(222.2 84% 4.9%);
        color: hsl(210 40% 98%);
      }

      :host([variant="outline"]:hover) {
        background-color: hsl(217.2 32.6% 17.5%);
      }
    }

    /* Custom CSS properties for theming */
    :host {
      --badge-primary: hsl(222.2 84% 4.9%);
      --badge-primary-foreground: hsl(210 40% 98%);
      --badge-secondary: hsl(210 40% 96%);
      --badge-secondary-foreground: hsl(222.2 84% 4.9%);
      --badge-destructive: hsl(0 84.2% 60.2%);
      --badge-destructive-foreground: hsl(210 40% 98%);
      --badge-border: hsl(214.3 31.8% 91.4%);
      --badge-background: hsl(0 0% 100%);
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

// Register the custom element
customElements.define('badge-component', BadgeComponent);

declare global {
  interface HTMLElementTagNameMap {
    'badge-component': BadgeComponent;
  }
}