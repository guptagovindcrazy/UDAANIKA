export default function Card({ children, className = '', as: Tag = 'div', ...props }) {
  return <Tag className={`card ${className}`.trim()} {...props}>{children}</Tag>;
}
