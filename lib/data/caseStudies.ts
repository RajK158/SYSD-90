import { CaseStudyDefinition, CaseStudyKey, CaseStudySectionKey } from '@/lib/types'

export const CASE_STUDIES: CaseStudyDefinition[] = [
  {
    key: 'url-shortener',
    title: 'URL Shortener',
    description: 'Design a URL shortening service like Bitly or TinyURL that handles billions of redirects per day.',
    week: 8,
    icon: '🔗',
  },
  {
    key: 'rate-limiter',
    title: 'Rate Limiter',
    description: 'Design a distributed rate limiting system that protects APIs from abuse and enforces usage quotas.',
    week: 4,
    icon: '🚦',
  },
  {
    key: 'notification-system',
    title: 'Notification System',
    description: 'Design a multi-channel notification system supporting push, email, SMS, and in-app notifications.',
    week: 5,
    icon: '🔔',
  },
  {
    key: 'social-media-feed',
    title: 'Social Media Feed',
    description: 'Design an Instagram/Twitter-style news feed with fanout, ranking, and real-time updates.',
    week: 9,
    icon: '📱',
  },
  {
    key: 'chat-application',
    title: 'Chat Application',
    description: 'Design a real-time messaging system like WhatsApp or Slack with delivery receipts and group chat.',
    week: 10,
    icon: '💬',
  },
  {
    key: 'video-streaming',
    title: 'Video Streaming Platform',
    description: 'Design a video streaming platform like YouTube or Netflix with upload, transcoding, and CDN delivery.',
    week: 11,
    icon: '🎥',
  },
  {
    key: 'search-autocomplete',
    title: 'Search Autocomplete',
    description: 'Design a search autocomplete system using tries, caching, and real-time ranking.',
    week: 11,
    icon: '🔍',
  },
  {
    key: 'ecommerce-system',
    title: 'E-Commerce System',
    description: 'Design an Amazon-style e-commerce platform with catalog, cart, orders, payments, and search.',
    week: 11,
    icon: '🛒',
  },
  {
    key: 'file-storage',
    title: 'File Storage System',
    description: 'Design a cloud file storage system like Google Drive or Dropbox with sync and sharing.',
    week: 7,
    icon: '📁',
  },
  {
    key: 'payment-system',
    title: 'Payment System',
    description: 'Design a payment processing system like Stripe or PayPal with reliability and idempotency.',
    week: 6,
    icon: '💳',
  },
  {
    key: 'ride-sharing',
    title: 'Ride Sharing System',
    description: 'Design a ride-sharing platform like Uber with real-time matching, geolocation, and surge pricing.',
    week: 9,
    icon: '🚗',
  },
  {
    key: 'web-crawler',
    title: 'Web Crawler',
    description: 'Design a distributed web crawler for search engines like Google with deduplication and politeness.',
    week: 5,
    icon: '🕷️',
  },
]

export const CASE_STUDY_SECTIONS: { key: CaseStudySectionKey; title: string; description: string }[] = [
  {
    key: 'requirements',
    title: 'Requirements Clarification',
    description: 'Functional and non-functional requirements. What the system must do vs how well it must do it.',
  },
  {
    key: 'scale_estimation',
    title: 'Scale Estimation',
    description: 'Back-of-the-envelope calculations: QPS, storage, bandwidth, memory requirements.',
  },
  {
    key: 'apis',
    title: 'API Design',
    description: 'RESTful or GraphQL API endpoints with request/response formats.',
  },
  {
    key: 'database_design',
    title: 'Database Design',
    description: 'Schema design, SQL vs NoSQL choice, indexes, and data models.',
  },
  {
    key: 'high_level_architecture',
    title: 'High-Level Architecture',
    description: 'Overall system diagram showing all major components and their interactions.',
  },
  {
    key: 'deep_dive',
    title: 'Deep Dive',
    description: 'Detailed design of the 1–2 most critical or interesting components.',
  },
  {
    key: 'bottlenecks',
    title: 'Bottlenecks',
    description: 'Identify potential bottlenecks and strategies to resolve them.',
  },
  {
    key: 'trade_offs',
    title: 'Trade-offs',
    description: 'Key decisions made and why: consistency vs availability, SQL vs NoSQL, etc.',
  },
  {
    key: 'failure_handling',
    title: 'Failure Handling',
    description: 'How the system handles failures: retries, circuit breakers, fallbacks.',
  },
  {
    key: 'monitoring',
    title: 'Monitoring & Observability',
    description: 'Logs, metrics, traces, alerts, SLOs, and dashboards.',
  },
  {
    key: 'final_summary',
    title: 'Final Interview Summary',
    description: 'A 60-second verbal summary of the entire design for mock interviews.',
  },
  {
    key: 'mock_completed',
    title: 'Mock Interview Completed',
    description: 'Practiced explaining this design in a 35–45 minute mock interview.',
  },
]

export function getCaseStudy(key: CaseStudyKey) {
  return CASE_STUDIES.find(cs => cs.key === key)
}
