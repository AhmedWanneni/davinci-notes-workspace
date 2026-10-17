import React from "react";

type SvgProps = React.SVGProps<SVGSVGElement>;

export const Svg = (props: SvgProps) => React.createElement("svg", props);
export const Path = (props: React.SVGProps<SVGPathElement>) =>
  React.createElement("path", props);
export const Rect = (props: React.SVGProps<SVGRectElement>) =>
  React.createElement("rect", props);
export const Circle = (props: React.SVGProps<SVGCircleElement>) =>
  React.createElement("circle", props);
export const Line = (props: React.SVGProps<SVGLineElement>) =>
  React.createElement("line", props);
export const G = (props: React.SVGProps<SVGGElement>) =>
  React.createElement("g", props);

export default Svg;
