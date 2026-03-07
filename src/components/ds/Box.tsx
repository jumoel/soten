import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

type SpacingToken = "0" | "0.5" | "1" | "1.5" | "2" | "3" | "4" | "6" | "12";

const spacingMap = {
  mt: {
    "0": "mt-0",
    "0.5": "mt-0.5",
    "1": "mt-1",
    "1.5": "mt-1.5",
    "2": "mt-2",
    "3": "mt-3",
    "4": "mt-4",
    "6": "mt-6",
    "12": "mt-12",
  },
  mb: {
    "0": "mb-0",
    "0.5": "mb-0.5",
    "1": "mb-1",
    "1.5": "mb-1.5",
    "2": "mb-2",
    "3": "mb-3",
    "4": "mb-4",
    "6": "mb-6",
    "12": "mb-12",
  },
  my: {
    "0": "my-0",
    "0.5": "my-0.5",
    "1": "my-1",
    "1.5": "my-1.5",
    "2": "my-2",
    "3": "my-3",
    "4": "my-4",
    "6": "my-6",
    "12": "my-12",
  },
  mx: {
    "0": "mx-0",
    "0.5": "mx-0.5",
    "1": "mx-1",
    "1.5": "mx-1.5",
    "2": "mx-2",
    "3": "mx-3",
    "4": "mx-4",
    "6": "mx-6",
    "12": "mx-12",
  },
  pt: {
    "0": "pt-0",
    "0.5": "pt-0.5",
    "1": "pt-1",
    "1.5": "pt-1.5",
    "2": "pt-2",
    "3": "pt-3",
    "4": "pt-4",
    "6": "pt-6",
    "12": "pt-12",
  },
  pb: {
    "0": "pb-0",
    "0.5": "pb-0.5",
    "1": "pb-1",
    "1.5": "pb-1.5",
    "2": "pb-2",
    "3": "pb-3",
    "4": "pb-4",
    "6": "pb-6",
    "12": "pb-12",
  },
  py: {
    "0": "py-0",
    "0.5": "py-0.5",
    "1": "py-1",
    "1.5": "py-1.5",
    "2": "py-2",
    "3": "py-3",
    "4": "py-4",
    "6": "py-6",
    "12": "py-12",
  },
  px: {
    "0": "px-0",
    "0.5": "px-0.5",
    "1": "px-1",
    "1.5": "px-1.5",
    "2": "px-2",
    "3": "px-3",
    "4": "px-4",
    "6": "px-6",
    "12": "px-12",
  },
} as const;

type SpacingProps = {
  [K in keyof typeof spacingMap]?: SpacingToken;
};

type BoxProps<T extends ElementType> = SpacingProps & {
  as?: T;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, keyof SpacingProps | "as" | "children">;

export function Box<T extends ElementType = "div">({
  as,
  children,
  mt,
  mb,
  my,
  mx,
  pt,
  pb,
  py,
  px,
  ...rest
}: BoxProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const classes = [
    mt && spacingMap.mt[mt],
    mb && spacingMap.mb[mb],
    my && spacingMap.my[my],
    mx && spacingMap.mx[mx],
    pt && spacingMap.pt[pt],
    pb && spacingMap.pb[pb],
    py && spacingMap.py[py],
    px && spacingMap.px[px],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes || undefined} {...rest}>
      {children}
    </Tag>
  );
}
