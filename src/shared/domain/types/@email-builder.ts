export interface IEmailComponent {
  id: string;
  type: "text" | "image" | "button" | "divider" | "link";
  name?: string;

  // Propriedades de texto
  content?: string;
  fontSize?: string;
  fontFamily?: string;
  textColor?: string;
  textAlign?: string;

  // Propriedades de imagem
  src?: string;
  alt?: string;
  imageStyles?: string[];
  width?: string;
  height?: string;

  // Propriedades de botão
  label?: string;
  href?: string;
  backgroundColor?: string;
  color?: string;
  buttonStyles?: string[];
  borderRadius?: string;
  fontWeight?: string;
  padding?: string;

  // Propriedades de divisor
  dividerStyles?: string[];
  thickness?: string;

  // Propriedades de link
  url?: string;
  linkText?: string;
  textDecoration?: string;
  display?: string;

  // Propriedades comuns
  styles?: string[];
  stylePreset?: string;
}

export interface IEmailTemplate {
  components: IEmailComponent[];
  createdAt: string;
}

export interface IStylePreset {
  id: string;
  name: string;
  properties: Partial<IEmailComponent>;
}

export interface ICreatePrimaryCopy {
  html: string;
  md: string;
  subject: string;
  pre_header: string;
  from_name: string;
  use_header: boolean;
  use_footer: boolean;
}
