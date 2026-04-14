"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { EmptyState } from "@/components/ui-states";
import { apiGet, apiPost } from "@/lib/api";
import { useAuthToken } from "@/lib/use-auth-token";

type Post = {
  id: string;
  title: string | null;
  body: string;
  author: { displayName: string | null };
  createdAt: string;
};

type PostsRes = { items: Post[] };
type CommentsRes = {
  items: Array<{ id: string; body: string; author: { displayName: string | null } }>;
};

export default function CommunityPage() {
  const { token } = useAuthToken();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentsRes | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [commentBody, setCommentBody] = useState("");

  const loadPosts = useCallback(async () => {
    if (!token) return;
    const res = await apiGet<PostsRes>("/v1/community/posts?page=1&pageSize=20", token);
    setPosts(res.items);
  }, [token]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const loadComments = async (postId: string) => {
    if (!token) return;
    const res = await apiGet<CommentsRes>(`/v1/community/posts/${postId}/comments`, token);
    setSelectedPostId(postId);
    setComments(res);
  };

  const createPost = async () => {
    if (!token || !body.trim()) return;
    await apiPost("/v1/community/posts", { title: title || undefined, body }, token);
    setTitle("");
    setBody("");
    await loadPosts();
  };

  const createComment = async () => {
    if (!token || !selectedPostId || !commentBody.trim()) return;
    await apiPost(`/v1/community/posts/${selectedPostId}/comments`, { body: commentBody }, token);
    setCommentBody("");
    await loadComments(selectedPostId);
  };

  return (
    <AppShell title="커뮤니티" subtitle="게시글과 댓글로 소통합니다.">
      <AuthGuard>
        <section className="grid gap-4 md:grid-cols-2">
          <article className="card p-4">
            <h2 className="mb-3 font-semibold">게시글 작성</h2>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목(선택)" />
            <textarea className="textarea mt-2" value={body} onChange={(e) => setBody(e.target.value)} placeholder="본문" />
            <button className="btn mt-2" onClick={() => void createPost()}>
              게시하기
            </button>

            <h3 className="mb-2 mt-4 font-semibold">게시글 목록</h3>
            {!posts.length ? <EmptyState label="아직 게시글이 없습니다." /> : null}
            <ul className="space-y-2">
              {posts.map((p) => (
                <li key={p.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                  <button className="w-full text-left" onClick={() => void loadComments(p.id)}>
                    <p className="font-medium">{p.title ?? "(제목 없음)"}</p>
                    <p className="line-clamp-2 text-sm" style={{ color: "var(--muted)" }}>{p.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          </article>

          <article className="card p-4">
            <h2 className="mb-3 font-semibold">댓글</h2>
            {!selectedPostId ? <p>좌측 게시글을 선택해 주세요.</p> : null}
            {selectedPostId ? (
              <>
                <textarea
                  className="textarea"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="댓글 내용"
                />
                <button className="btn mt-2" onClick={() => void createComment()}>
                  댓글 등록
                </button>
                <ul className="mt-3 space-y-2">
                  {comments?.items?.map((c) => (
                    <li key={c.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                      <p className="text-sm" style={{ color: "var(--muted)" }}>{c.author.displayName ?? "익명"}</p>
                      <p>{c.body}</p>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </article>
        </section>
      </AuthGuard>
    </AppShell>
  );
}
