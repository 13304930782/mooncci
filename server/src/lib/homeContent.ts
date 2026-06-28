export type HomeTopic = {
  title: string;
  description: string;
  to: string;
  icon?: string;
};

export type HomeSettings = {
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  primary_cta_label: string;
  primary_cta_url: string;
  secondary_cta_label: string;
  secondary_cta_url: string;
  hero_chips: string[];
  featured_badge: string;
  featured_fallback_title: string;
  featured_fallback_summary: string;
  latest_eyebrow: string;
  latest_title: string;
  latest_description: string;
  topics_eyebrow: string;
  topics_title: string;
  topics: HomeTopic[];
  about_eyebrow: string;
  about_title: string;
  about_intro: string;
  about_description: string;
  about_email: string;
  about_github: string;
};

export const defaultHomeTopics: HomeTopic[] = [
  {
    title: 'Web 全栈开发',
    description: 'React、Node.js、接口设计、前后端协作和真实项目里的工程细节。',
    icon: 'code',
    to: '/category/Web 全栈开发',
  },
  {
    title: 'Linux / OpenWrt',
    description: '服务器部署、路由器折腾、服务监控，以及系统层面的排障记录。',
    icon: 'terminal',
    to: '/category/Linux',
  },
  {
    title: '网络技术',
    description: 'Nginx、Cloudflare、反向代理、连接跟踪和家庭网络实践。',
    icon: 'network',
    to: '/category/网络技术',
  },
  {
    title: '数据库 / 软件工程',
    description: 'MySQL 表结构、迁移、权限边界、测试和长期维护的方法。',
    icon: 'database',
    to: '/category/数据库',
  },
  {
    title: '项目实践',
    description: '把一个个人站从能跑，整理到安全、可部署、可持续维护。',
    icon: 'server',
    to: '/articles',
  },
];

export const defaultHomeSettings: HomeSettings = {
  hero_eyebrow: 'Software Engineering Notes',
  hero_title: 'mooncci Blog',
  hero_subtitle: '记录 Web 开发、Linux、OpenWrt、网络技术、系统设计和项目实践中的经验与踩坑。',
  hero_description: '这里是一份长期积累的工程笔记：从前端界面、后端接口、数据库、部署排障，到路由器和网络监控，把真正踩过的坑写清楚。',
  primary_cta_label: '开始阅读',
  primary_cta_url: '/articles',
  secondary_cta_label: '查看最新文章',
  secondary_cta_url: '#latest',
  hero_chips: ['持续更新中', 'Web / Linux / OpenWrt / 网络', '项目实践'],
  featured_badge: '推荐阅读',
  featured_fallback_title: '精选文章正在准备中',
  featured_fallback_summary: '当有文章发布后，这里会展示最值得先读的一篇内容，让读者第一眼看到真正有价值的技术记录。',
  latest_eyebrow: 'Latest Posts',
  latest_title: '最近更新',
  latest_description: '最新文章放在最前面，方便快速判断这个博客最近在持续写什么。',
  topics_eyebrow: 'Topics',
  topics_title: '技术专栏',
  topics: defaultHomeTopics,
  about_eyebrow: 'About',
  about_title: '关于作者',
  about_intro: '我是 mooncci，一名软件工程学生，也是在持续补齐工程能力的全栈开发学习者。',
  about_description: '目前主要关注 Web 开发、网络、系统部署、数据库设计和项目实践。这个博客会尽量把“为什么这么做”“哪里容易坏”“怎么验证”写清楚。',
  about_email: 'websiteaccount@mooncci.site',
  about_github: 'https://github.com/',
};

function asString(value: unknown, fallback: string) {
  if (value == null) return fallback;
  return String(value);
}

function asStringArray(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return fallback;
}

function asTopics(value: unknown, fallback: HomeTopic[]) {
  if (!Array.isArray(value)) return fallback;

  const topics = value
    .map((item) => ({
      title: String(item?.title || '').trim(),
      description: String(item?.description || '').trim(),
      to: String(item?.to || '').trim(),
      icon: String(item?.icon || '').trim(),
    }))
    .filter((item) => item.title && item.description && item.to);

  return topics.length ? topics : fallback;
}

export function normalizeHomeSettings(input: any): HomeSettings {
  const source = input || {};

  return {
    hero_eyebrow: asString(source.hero_eyebrow, defaultHomeSettings.hero_eyebrow),
    hero_title: asString(source.hero_title, defaultHomeSettings.hero_title),
    hero_subtitle: asString(source.hero_subtitle, defaultHomeSettings.hero_subtitle),
    hero_description: asString(source.hero_description, defaultHomeSettings.hero_description),
    primary_cta_label: asString(source.primary_cta_label, defaultHomeSettings.primary_cta_label),
    primary_cta_url: asString(source.primary_cta_url, defaultHomeSettings.primary_cta_url),
    secondary_cta_label: asString(source.secondary_cta_label, defaultHomeSettings.secondary_cta_label),
    secondary_cta_url: asString(source.secondary_cta_url, defaultHomeSettings.secondary_cta_url),
    hero_chips: asStringArray(source.hero_chips, defaultHomeSettings.hero_chips),
    featured_badge: asString(source.featured_badge, defaultHomeSettings.featured_badge),
    featured_fallback_title: asString(source.featured_fallback_title, defaultHomeSettings.featured_fallback_title),
    featured_fallback_summary: asString(source.featured_fallback_summary, defaultHomeSettings.featured_fallback_summary),
    latest_eyebrow: asString(source.latest_eyebrow, defaultHomeSettings.latest_eyebrow),
    latest_title: asString(source.latest_title, defaultHomeSettings.latest_title),
    latest_description: asString(source.latest_description, defaultHomeSettings.latest_description),
    topics_eyebrow: asString(source.topics_eyebrow, defaultHomeSettings.topics_eyebrow),
    topics_title: asString(source.topics_title, defaultHomeSettings.topics_title),
    topics: asTopics(source.topics, defaultHomeSettings.topics),
    about_eyebrow: asString(source.about_eyebrow, defaultHomeSettings.about_eyebrow),
    about_title: asString(source.about_title, defaultHomeSettings.about_title),
    about_intro: asString(source.about_intro, defaultHomeSettings.about_intro),
    about_description: asString(source.about_description, defaultHomeSettings.about_description),
    about_email: asString(source.about_email, defaultHomeSettings.about_email),
    about_github: asString(source.about_github, defaultHomeSettings.about_github),
  };
}
