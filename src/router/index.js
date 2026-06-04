import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import ToolPageLayout from "../views/ToolPageLayout.vue";
import WatermarkRemover from "../components/WatermarkRemover.vue";
import ImageCompressor from "../components/ImageCompressor.vue";
import VideoExtractor from "../components/VideoExtractor.vue";
import MarkdownWordConverter from "../components/MarkdownWordConverter.vue";
import MarkdownDocLayout from "../views/MarkdownDocLayout.vue";
import ToolboxPage from "../views/ToolboxPage.vue";
import ImageCropper from "../components/ImageCropper.vue";
import ImageFormatConverter from "../components/ImageFormatConverter.vue";
import PdfToWord from "../components/PdfToWord.vue";
import PdfMerger from "../components/PdfMerger.vue";
import { SEO_META } from "./seo";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/image-watermark-remover",
    component: ToolPageLayout,
    children: [
      {
        path: "",
        name: "WatermarkRemover",
        component: WatermarkRemover,
      },
    ],
  },
  {
    path: "/image-compressor",
    component: ToolPageLayout,
    children: [
      {
        path: "",
        name: "ImageCompressor",
        component: ImageCompressor,
      },
    ],
  },
  {
    path: "/video-link-extractor",
    component: ToolPageLayout,
    children: [
      {
        path: "",
        name: "VideoExtractor",
        component: VideoExtractor,
      },
    ],
  },
  {
    path: "/markdown-word-converter",
    component: MarkdownDocLayout,
    children: [
      {
        path: "",
        name: "MarkdownWordConverter",
        component: MarkdownWordConverter,
      },
    ],
  },
  {
    path: "/toolbox",
    name: "Toolbox",
    component: ToolboxPage,
  },
  {
    path: "/toolbox/image-cropper",
    component: ToolPageLayout,
    children: [
      {
        path: "",
        name: "ImageCropper",
        component: ImageCropper,
      },
    ],
  },
  {
    path: "/toolbox/image-format-converter",
    component: ToolPageLayout,
    children: [
      {
        path: "",
        name: "ImageFormatConverter",
        component: ImageFormatConverter,
      },
    ],
  },
  {
    path: "/toolbox/pdf-to-word",
    component: ToolPageLayout,
    children: [
      {
        path: "",
        name: "PdfToWord",
        component: PdfToWord,
      },
    ],
  },
  {
    path: "/toolbox/pdf-merger",
    component: ToolPageLayout,
    children: [
      {
        path: "",
        name: "PdfMerger",
        component: PdfMerger,
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  const lang = document.documentElement.lang === "zh-CN" ? "zh" : "en";
  const meta = SEO_META[to.name] || SEO_META.Home;
  const url = `https://www.viewmax.top${to.path}`;

  document.title = meta.title[lang];

  setMetaTag("description", meta.description[lang]);
  setMetaTag("keywords", meta.keywords);
  setMetaTag("author", "ViewMax");
  setMetaTag("robots", "index, follow");
  setMetaTag("googlebot", "index, follow");
  setMetaTag("baiduspider", "index, follow");

  setPropertyMeta("og:title", meta.title[lang]);
  setPropertyMeta("og:description", meta.description[lang]);
  setPropertyMeta("og:url", url);
  setPropertyMeta("og:type", "website");
  setPropertyMeta("og:site_name", "ViewMax");
  setPropertyMeta("og:locale", lang === "zh" ? "zh_CN" : "en_US");

  setPropertyMeta("twitter:card", "summary_large_image");
  setPropertyMeta("twitter:title", meta.title[lang]);
  setPropertyMeta("twitter:description", meta.description[lang]);

  setLinkTag("canonical", url);

  injectJsonLd(to, meta, lang);
});

function setMetaTag(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setPropertyMeta(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setLinkTag(rel, href) {
  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

function injectJsonLd(to, meta, lang) {
  const oldScript = document.getElementById("seo-jsonld");
  if (oldScript) oldScript.remove();

  const url = `https://www.viewmax.top${to.path}`;
  const toolNames = {
    WatermarkRemover: "image-watermark-remover",
    ImageCompressor: "image-compressor",
    VideoExtractor: "video-link-extractor",
    MarkdownWordConverter: "markdown-word-converter",
    Toolbox: "toolbox",
    ImageCropper: "toolbox/image-cropper",
    ImageFormatConverter: "toolbox/image-format-converter",
    PdfToWord: "toolbox/pdf-to-word",
    PdfMerger: "toolbox/pdf-merger",
  };

  let jsonLd;

  if (to.name === "Home") {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: meta.title[lang],
      description: meta.description[lang],
      url: url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${url}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
      inLanguage: lang === "zh" ? "zh-CN" : "en-US",
    };
  } else if (toolNames[to.name]) {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: meta.title[lang],
      description: meta.description[lang],
      url: url,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web Browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Organization",
        name: "ViewMax",
        url: "https://www.viewmax.top",
      },
      inLanguage: lang === "zh" ? "zh-CN" : "en-US",
    };
  } else {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: meta.title[lang],
      description: meta.description[lang],
      url: url,
      isPartOf: {
        "@type": "WebSite",
        name: "ViewMax",
        url: "https://www.viewmax.top",
      },
      inLanguage: lang === "zh" ? "zh-CN" : "en-US",
    };
  }

  const script = document.createElement("script");
  script.id = "seo-jsonld";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
}

export default router;
