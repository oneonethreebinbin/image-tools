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
  document.title = meta.title[lang];

  setMetaTag("description", meta.description[lang]);
  setMetaTag("keywords", meta.keywords);
  setPropertyMeta("og:title", meta.title[lang]);
  setPropertyMeta("og:description", meta.description[lang]);
  setPropertyMeta("og:url", `https://www.viewmax.top${to.path}`);
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

export default router;
