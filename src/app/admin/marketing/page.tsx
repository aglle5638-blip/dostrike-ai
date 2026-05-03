'use client';

/**
 * /admin/marketing
 *
 * SNS投稿管理ダッシュボード。
 * - 投稿履歴一覧
 * - プラットフォーム別成功率
 * - 「今すぐ投稿」手動トリガー
 * - テンプレートプレビュー
 *
 * アクセス制御: このページは /admin/* ルートにあるため、
 * middleware.ts か環境変数でアクセス制限を設けること。
 */

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw, Send, CheckCircle, XCircle, Clock, MessageCircle, Camera, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { pickTemplate, getTodayFaceTypeId, FACE_TYPES } from '@/lib/social-templates';

// ─────────────────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────────────────

interface SocialPost {
  id: string;
  platform: 'x' | 'instagram';
  template_key: string;
  content: string;
  post_id: string | null;
  posted_at: string | null;
  likes: number;
  retweets: number;
  status: 'pending' | 'posted' | 'failed' | 'skipped';
  error_message: string | null;
  created_at: string;
}

interface Summary {
  total: number;
  lastWeek: {
    x: { posted: number; failed: number };
    instagram: { posted: number; failed: number };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SocialPost['status'] }) {
  const config = {
    posted:  { icon: CheckCircle, label: '投稿済み', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    failed:  { icon: XCircle,     label: '失敗',     cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    skipped: { icon: Clock,       label: 'スキップ', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    pending: { icon: Clock,       label: '保留',     cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  }[status];

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold ${config.cls}`}>
      <Icon className="w-3 h-3" /> {config.label}
    </span>
  );
}

function PlatformIcon({ platform }: { platform: 'x' | 'instagram' }) {
  if (platform === 'x') return <MessageCircle className="w-4 h-4 text-sky-400" />;
  return <Camera className="w-4 h-4 text-pink-400" />;
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className={`bg-slate-800/60 border rounded-2xl p-5 ${color}`}>
      <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function TemplatePreview() {
  const [platform, setPlatform] = useState<'x' | 'instagram'>('x');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const faceTypeId = getTodayFaceTypeId();
    setPreview(pickTemplate(platform, faceTypeId));
  }, [platform]);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" /> 今日のテンプレートプレビュー
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setPlatform('x')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${platform === 'x' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            X
          </button>
          <button
            onClick={() => setPlatform('instagram')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${platform === 'instagram' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            Instagram
          </button>
        </div>
      </div>
      <div className="bg-slate-900/60 rounded-xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
        {preview || '読み込み中...'}
      </div>
      <p className="text-xs text-slate-500 mt-3">
        今日の顔タイプ: {(() => {
          const id = getTodayFaceTypeId();
          const ft = FACE_TYPES[id];
          return `${ft.emoji} ${ft.name} (${id})`;
        })()}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// メインページ
// ─────────────────────────────────────────────────────────────────────────────

export default function MarketingDashboard() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<'' | 'x' | 'instagram'>('');
  const [filterStatus, setFilterStatus] = useState<'' | 'posted' | 'failed' | 'skipped'>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPlatform) params.set('platform', filterPlatform);
      if (filterStatus)   params.set('status', filterStatus);

      const res = await fetch(`/api/admin/social-posts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPosts(data.posts ?? []);
      setSummary(data.summary ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterPlatform, filterStatus]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const triggerPost = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/cron/social-post', { method: 'POST' });
      const json = await res.json();
      setTriggerResult(JSON.stringify(json.results, null, 2));
      await fetchPosts();
    } catch (err) {
      setTriggerResult(`エラー: ${String(err)}`);
    } finally {
      setTriggering(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ヘッダー */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-lg leading-none">マーケティング管理</h1>
            <p className="text-xs text-slate-500 mt-0.5">ドストライクAI — SNS自動投稿</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPosts}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="更新"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={triggerPost}
            disabled={triggering}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/80 disabled:opacity-50 transition-colors shadow-[0_4px_14px_rgba(244,63,94,0.3)]"
          >
            <Send className="w-4 h-4" />
            {triggering ? '投稿中...' : '今すぐ投稿'}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* 手動投稿結果 */}
        {triggerResult && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-400 mb-2">投稿結果</p>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono overflow-auto max-h-40">{triggerResult}</pre>
          </div>
        )}

        {/* 統計カード */}
        {summary && (
          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">過去7日間</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="X 投稿数" value={summary.lastWeek.x.posted} color="border-sky-500/20" sub="成功" />
              <StatCard label="X 失敗" value={summary.lastWeek.x.failed} color="border-red-500/20" sub="要確認" />
              <StatCard label="Instagram 投稿数" value={summary.lastWeek.instagram.posted} color="border-pink-500/20" sub="成功" />
              <StatCard label="Instagram 失敗" value={summary.lastWeek.instagram.failed} color="border-red-500/20" sub="要確認" />
            </div>
          </section>
        )}

        {/* テンプレートプレビュー */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">テンプレートプレビュー</h2>
          <TemplatePreview />
        </section>

        {/* 投稿履歴 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">投稿履歴</h2>
            <div className="flex items-center gap-2">
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value as '' | 'x' | 'instagram')}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary"
              >
                <option value="">全プラットフォーム</option>
                <option value="x">X</option>
                <option value="instagram">Instagram</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as '' | 'posted' | 'failed' | 'skipped')}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary"
              >
                <option value="">全ステータス</option>
                <option value="posted">投稿済み</option>
                <option value="failed">失敗</option>
                <option value="skipped">スキップ</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl h-20 animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 text-center">
              <p className="text-slate-500 text-sm">投稿履歴がありません</p>
              <p className="text-xs text-slate-600 mt-1">「今すぐ投稿」ボタンで初回投稿を試してください</p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors"
                >
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                  >
                    <PlatformIcon platform={post.platform} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{post.content.split('\n')[0]}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {post.template_key !== 'cta' ? `顔タイプ: ${post.template_key}` : '汎用CTA'} · {formatDate(post.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {post.status === 'posted' && (
                        <span className="text-xs text-slate-500">
                          ♡ {post.likes} · RT {post.retweets}
                        </span>
                      )}
                      <StatusBadge status={post.status} />
                      {expandedId === post.id
                        ? <ChevronUp className="w-4 h-4 text-slate-500" />
                        : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>

                  {expandedId === post.id && (
                    <div className="px-4 pb-4 border-t border-slate-700/50 pt-3">
                      <p className="text-xs font-bold text-slate-400 mb-2">投稿テキスト</p>
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-900/50 rounded-xl p-3">
                        {post.content}
                      </pre>
                      {post.post_id && (
                        <p className="text-xs text-slate-500 mt-2">
                          投稿ID: <span className="font-mono">{post.post_id}</span>
                          {post.platform === 'x' && (
                            <a
                              href={`https://x.com/i/web/status/${post.post_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-sky-400 hover:underline"
                            >
                              Xで確認 →
                            </a>
                          )}
                        </p>
                      )}
                      {post.error_message && (
                        <p className="text-xs text-red-400 mt-2 bg-red-500/10 rounded-lg p-2">
                          エラー: {post.error_message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cron スケジュール */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">自動投稿スケジュール</h2>
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { time: '08:00 JST', utc: '23:00 UTC', label: '朝の投稿' },
              { time: '12:00 JST', utc: '03:00 UTC', label: '昼の投稿' },
              { time: '21:00 JST', utc: '12:00 UTC', label: '夜の投稿' },
            ].map((s) => (
              <div key={s.time} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-white">{s.time}</p>
                  <p className="text-xs text-slate-500">{s.label} · {s.utc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
