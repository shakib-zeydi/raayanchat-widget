import WidgetLoader from "./widget-loader";

interface WidgetProps {
  websiteId: string;
  themeColor?: string;
}

export default function Widget(props: WidgetProps) {
  return <WidgetLoader key={props.websiteId} {...props} />;
}
