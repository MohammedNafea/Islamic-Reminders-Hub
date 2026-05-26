import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateText } from "@/lib/google-translate";
import { getLanguageDir, isRTL } from "@/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TranslatedTextProps {
  text: string;
  staticTranslation?: string;
  keepArabic?: boolean;
  isDhikr?: boolean;
  className?: string;
  arabicClassName?: string;
  translationClassName?: string;
  inline?: boolean;
}

export function TranslatedText({
  text,
  staticTranslation,
  keepArabic = true,
  isDhikr,
  className,
  arabicClassName,
  translationClassName,
  inline = false,
}: TranslatedTextProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const [translated, setTranslated] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // If static translation is provided and not empty, use it directly
    if (staticTranslation && staticTranslation.trim().length > 0) {
      setTranslated(staticTranslation);
      setLoading(false);
      return;
    }

    // If language is Arabic, we don't need any translation
    if (currentLang === "ar") {
      setTranslated("");
      setLoading(false);
      return;
    }

    // Otherwise, fetch dynamic translation client-side
    let isMounted = true;
    setLoading(true);

    translateText(text, currentLang)
      .then((result) => {
        if (isMounted) {
          setTranslated(result);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Translation error in component:", error);
        if (isMounted) {
          setTranslated(text);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [text, currentLang, staticTranslation]);

  const dir = getLanguageDir(currentLang);
  const isTargetRTL = isRTL(currentLang);
  const alignClass = inline ? "" : (isTargetRTL ? "text-right" : "text-left");

  const ContainerTag = inline ? "span" : "div";
  const TextTag = inline ? "span" : "p";

  const isDhikrText = isDhikr !== undefined ? isDhikr : keepArabic;

  // If the language is Arabic, we only show the Arabic text (or staticTranslation if provided)
  if (currentLang === "ar") {
    return (
      <TextTag
        className={cn(
          isDhikrText 
            ? "dhikr-text text-center w-full block" 
            : cn("font-sans text-foreground", !inline && "text-right"),
          arabicClassName,
          className
        )}
        dir="rtl"
      >
        {staticTranslation || text}
      </TextTag>
    );
  }

  // Loading state
  if (loading) {
    if (keepArabic) {
      return (
        <ContainerTag className={cn("space-y-2", className)}>
          <TextTag
            className={cn(
              isDhikrText 
                ? "dhikr-text text-center w-full block" 
                : cn("font-sans text-foreground", !inline && "text-right"),
              arabicClassName
            )}
            dir="rtl"
          >
            {text}
          </TextTag>
          <Skeleton
            className={cn(
              "h-4 w-3/4 mt-2",
              isDhikrText ? "mx-auto" : (isTargetRTL ? "ml-auto" : "mr-auto"),
              translationClassName
            )}
          />
        </ContainerTag>
      );
    } else {
      return (
        <Skeleton
          className={cn(
            "h-4 w-full",
            isTargetRTL ? "ml-auto" : "mr-auto",
            className
          )}
        />
      );
    }
  }

  // Render translation
  if (keepArabic) {
    return (
      <ContainerTag className={cn("space-y-3", className)}>
        {/* Arabic original on top */}
        <TextTag
          className={cn(
            isDhikrText 
              ? "dhikr-text text-center w-full block" 
              : cn("font-sans text-foreground", !inline && "text-right"),
            "leading-relaxed",
            arabicClassName
          )}
          dir="rtl"
        >
          {text}
        </TextTag>
        {/* Translation underneath */}
        {translated && (
          <TextTag
            className={cn(
              "text-muted-foreground text-base leading-relaxed border-t border-border/30 pt-3 mt-3",
              isDhikrText ? "text-center w-full block" : alignClass,
              translationClassName
            )}
            dir={dir}
          >
            {translated}
          </TextTag>
        )}
      </ContainerTag>
    );
  }

  // Render translation only
  return (
    <TextTag
      className={cn("leading-relaxed", alignClass, translationClassName, className)}
      dir={dir}
    >
      {translated || text}
    </TextTag>
  );
}

