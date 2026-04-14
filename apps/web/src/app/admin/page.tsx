"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { ThemeToggle } from "@/components/theme-toggle";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui-states";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useAuthToken } from "@/lib/use-auth-token";

type AdminList<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

type UserRow = {
  id: string;
  email: string | null;
  displayName: string | null;
  status: string;
  role: string;
  createdAt: string;
};

type UserDetail = UserRow & {
  linkedProviders?: string[];
  updatedAt: string;
};

type NoticeRow = {
  id: string;
  title: string;
  body?: string;
  status: "draft" | "scheduled" | "published" | "ended";
  isDraft?: boolean;
  pinned: boolean;
  publishStartAt: string | null;
  publishEndAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type BannerRow = {
  id: string;
  text: string;
  source: string;
  priority: number;
  active: boolean;
  startAt: string | null;
  endAt: string | null;
};

type Tab = "notices" | "banners" | "users";
const PAGE_SIZE = 15;

const emptyNoticeForm = {
  title: "",
  body: "",
  pinned: false,
  isDraft: false,
  publishStartAt: "",
  publishEndAt: "",
};

const emptyBannerForm = {
  text: "",
  source: "lifeNote",
  priority: 0,
  active: true,
  startAt: "",
  endAt: "",
};

const noticeStatusLabel: Record<NoticeRow["status"], string> = {
  draft: "임시저장",
  scheduled: "예약",
  published: "게시중",
  ended: "종료",
};

const userStatusLabel: Record<"active" | "suspended", string> = {
  active: "활성",
  suspended: "정지",
};

export default function AdminPage() {
  const { token, user, signOut } = useAuthToken();
  const [tab, setTab] = useState<Tab>("notices");

  const [noticePage, setNoticePage] = useState(1);
  const [noticeSearch, setNoticeSearch] = useState("");
  const [noticeStatus, setNoticeStatus] = useState("all");
  const [noticeStartDate, setNoticeStartDate] = useState("");
  const [noticeEndDate, setNoticeEndDate] = useState("");
  const [appliedNoticeFilters, setAppliedNoticeFilters] = useState({
    search: "",
    status: "all",
    startDate: "",
    endDate: "",
  });

  const [bannerPage, setBannerPage] = useState(1);
  const [bannerSearch, setBannerSearch] = useState("");
  const [bannerActive, setBannerActive] = useState("all");
  const [appliedBannerFilters, setAppliedBannerFilters] = useState({
    search: "",
    active: "all",
  });

  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userStatus, setUserStatus] = useState("all");
  const [appliedUserFilters, setAppliedUserFilters] = useState({
    search: "",
    status: "all",
  });

  const [notices, setNotices] = useState<AdminList<NoticeRow> | null>(null);
  const [banners, setBanners] = useState<AdminList<BannerRow> | null>(null);
  const [users, setUsers] = useState<AdminList<UserRow> | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [noticeEditorOpen, setNoticeEditorOpen] = useState(false);
  const [noticePreviewOpen, setNoticePreviewOpen] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<NoticeRow | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeForm, setNoticeForm] = useState(emptyNoticeForm);

  const [bannerEditorOpen, setBannerEditorOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);

  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userEditName, setUserEditName] = useState("");
  const [userEditStatus, setUserEditStatus] = useState<"active" | "suspended">("active");

  const noticeQuery = useMemo(() => {
    const q = new URLSearchParams({ page: String(noticePage), pageSize: String(PAGE_SIZE) });
    if (appliedNoticeFilters.search.trim()) q.set("search", appliedNoticeFilters.search.trim());
    if (appliedNoticeFilters.status !== "all") q.set("status", appliedNoticeFilters.status);
    if (appliedNoticeFilters.startDate) q.set("startDate", new Date(`${appliedNoticeFilters.startDate}T00:00:00.000Z`).toISOString());
    if (appliedNoticeFilters.endDate) q.set("endDate", new Date(`${appliedNoticeFilters.endDate}T23:59:59.999Z`).toISOString());
    return q.toString();
  }, [noticePage, appliedNoticeFilters]);
  const hasNoticeFilters =
    appliedNoticeFilters.search.trim().length > 0 ||
    appliedNoticeFilters.status !== "all" ||
    Boolean(appliedNoticeFilters.startDate) ||
    Boolean(appliedNoticeFilters.endDate);

  const bannerQuery = useMemo(() => {
    const q = new URLSearchParams({ page: String(bannerPage), pageSize: String(PAGE_SIZE) });
    if (appliedBannerFilters.active !== "all") q.set("active", appliedBannerFilters.active);
    return q.toString();
  }, [bannerPage, appliedBannerFilters.active]);
  const hasBannerFilters = appliedBannerFilters.search.trim().length > 0 || appliedBannerFilters.active !== "all";

  const userQuery = useMemo(() => {
    const q = new URLSearchParams({ page: String(userPage), pageSize: String(PAGE_SIZE) });
    if (appliedUserFilters.search.trim()) q.set("search", appliedUserFilters.search.trim());
    if (appliedUserFilters.status !== "all") q.set("status", appliedUserFilters.status);
    return q.toString();
  }, [userPage, appliedUserFilters]);
  const hasUserFilters = appliedUserFilters.search.trim().length > 0 || appliedUserFilters.status !== "all";

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [n, b, u] = await Promise.all([
        apiGet<AdminList<NoticeRow>>(`/v1/admin/notices?${noticeQuery}`, token),
        apiGet<AdminList<BannerRow>>(`/v1/admin/quote-banners?${bannerQuery}`, token),
        apiGet<AdminList<UserRow>>(`/v1/admin/users?${userQuery}`, token),
      ]);
      const filteredBanners = appliedBannerFilters.search.trim()
        ? {
            ...b,
            items: b.items.filter((item) =>
              `${item.text} ${item.source}`.toLowerCase().includes(appliedBannerFilters.search.trim().toLowerCase()),
            ),
          }
        : b;

      setNotices(n);
      setBanners(filteredBanners);
      setUsers(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : "관리자 데이터 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [token, noticeQuery, bannerQuery, userQuery, appliedBannerFilters.search]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreateNotice = () => {
    setEditingNoticeId(null);
    setNoticeForm(emptyNoticeForm);
    setNoticeEditorOpen(true);
  };

  const openEditNotice = async (id: string) => {
    if (!token) return;
    const detail = await apiGet<NoticeRow>(`/v1/admin/notices/${id}`, token);
    setEditingNoticeId(id);
    setNoticeForm({
      title: detail.title,
      body: detail.body ?? "",
      pinned: detail.pinned,
      isDraft: detail.isDraft ?? detail.status === "draft",
      publishStartAt: detail.publishStartAt ? detail.publishStartAt.slice(0, 10) : "",
      publishEndAt: detail.publishEndAt ? detail.publishEndAt.slice(0, 10) : "",
    });
    setNoticeEditorOpen(true);
  };

  const openPreviewNotice = async (id: string) => {
    if (!token) return;
    const detail = await apiGet<NoticeRow>(`/v1/admin/notices/${id}`, token);
    setPreviewNotice(detail);
    setNoticePreviewOpen(true);
  };

  const saveNotice = async () => {
    if (!token) return;
    const payload = {
      title: noticeForm.title,
      body: noticeForm.body,
      pinned: noticeForm.pinned,
      isDraft: noticeForm.isDraft,
      publishStartAt: noticeForm.publishStartAt ? new Date(`${noticeForm.publishStartAt}T00:00:00.000Z`).toISOString() : "",
      publishEndAt: noticeForm.publishEndAt ? new Date(`${noticeForm.publishEndAt}T23:59:59.999Z`).toISOString() : "",
    };

    if (editingNoticeId) {
      await apiPatch(`/v1/admin/notices/${editingNoticeId}`, payload, token);
    } else {
      await apiPost(`/v1/admin/notices`, payload, token);
    }

    setNoticeEditorOpen(false);
    await loadData();
  };

  const removeNotice = async (id: string) => {
    if (!token) return;
    if (!window.confirm("공지사항을 삭제하시겠습니까?")) return;
    await apiDelete(`/v1/admin/notices/${id}`, token);
    await loadData();
  };

  const openCreateBanner = () => {
    setEditingBannerId(null);
    setBannerForm(emptyBannerForm);
    setBannerEditorOpen(true);
  };

  const openEditBanner = (banner: BannerRow) => {
    setEditingBannerId(banner.id);
    setBannerForm({
      text: banner.text,
      source: banner.source,
      priority: banner.priority,
      active: banner.active,
      startAt: banner.startAt ? banner.startAt.slice(0, 10) : "",
      endAt: banner.endAt ? banner.endAt.slice(0, 10) : "",
    });
    setBannerEditorOpen(true);
  };

  const saveBanner = async () => {
    if (!token) return;
    const payload = {
      text: bannerForm.text,
      source: bannerForm.source,
      priority: Number(bannerForm.priority),
      active: bannerForm.active,
      startAt: bannerForm.startAt ? new Date(`${bannerForm.startAt}T00:00:00.000Z`).toISOString() : "",
      endAt: bannerForm.endAt ? new Date(`${bannerForm.endAt}T23:59:59.999Z`).toISOString() : "",
    };

    if (editingBannerId) {
      await apiPatch(`/v1/admin/quote-banners/${editingBannerId}`, payload, token);
    } else {
      await apiPost(`/v1/admin/quote-banners`, payload, token);
    }

    setBannerEditorOpen(false);
    await loadData();
  };

  const removeBanner = async (id: string) => {
    if (!token) return;
    if (!window.confirm("배너를 삭제하시겠습니까?")) return;
    await apiDelete(`/v1/admin/quote-banners/${id}`, token);
    await loadData();
  };

  const openUserDetail = async (id: string) => {
    if (!token) return;
    const detail = await apiGet<UserDetail>(`/v1/admin/users/${id}`, token);
    setSelectedUser(detail);
    setUserEditName(detail.displayName ?? "");
    setUserEditStatus((detail.status as "active" | "suspended") ?? "active");
    setUserDetailOpen(true);
  };

  const saveUser = async () => {
    if (!token || !selectedUser) return;
    await apiPatch(
      `/v1/admin/users/${selectedUser.id}`,
      { displayName: userEditName, status: userEditStatus },
      token,
    );
    setUserDetailOpen(false);
    await loadData();
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="admin-shell">
        <aside className="admin-side">
          <p className="admin-brand">lifeNote Admin</p>
          <nav className="admin-nav">
            <button className={`admin-nav-btn ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>회원관리</button>
            <button className={`admin-nav-btn ${tab === "banners" ? "active" : ""}`} onClick={() => setTab("banners")}>배너관리</button>
            <button className={`admin-nav-btn ${tab === "notices" ? "active" : ""}`} onClick={() => setTab("notices")}>공지사항</button>
          </nav>
        </aside>

        <main className="admin-main">
          <header className="card admin-topbar">
            <h1 className="text-xl font-semibold">{tab === "notices" ? "공지사항" : tab === "banners" ? "명언 배너" : "회원관리"}</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="badge">{user?.displayName ?? "관리자"}</span>
              {tab === "notices" ? <button className="btn" onClick={openCreateNotice}>새 공지</button> : null}
              {tab === "banners" ? <button className="btn" onClick={openCreateBanner}>새 배너</button> : null}
              <button className="btn btn-secondary" onClick={signOut}>로그아웃</button>
            </div>
          </header>

          {loading ? <LoadingState label="관리자 데이터를 불러오는 중..." /> : null}
          {error ? <ErrorState message={error} /> : null}

          {tab === "notices" ? (
            <section className="card admin-section">
              <div className="admin-filters admin-filters-notice">
                <input className="input" placeholder="제목/본문 검색" value={noticeSearch} onChange={(e) => setNoticeSearch(e.target.value)} />
                <select className="select" value={noticeStatus} onChange={(e) => setNoticeStatus(e.target.value)}>
                  <option value="all">전체 상태</option>
                  <option value="draft">임시저장</option>
                  <option value="scheduled">예약</option>
                  <option value="published">게시중</option>
                  <option value="ended">종료</option>
                </select>
                <input className="input" type="date" value={noticeStartDate} onChange={(e) => setNoticeStartDate(e.target.value)} />
                <input className="input" type="date" value={noticeEndDate} onChange={(e) => setNoticeEndDate(e.target.value)} />
                <button className="btn" onClick={() => { setAppliedNoticeFilters({ search: noticeSearch, status: noticeStatus, startDate: noticeStartDate, endDate: noticeEndDate }); setNoticePage(1); }}>검색</button>
                {hasNoticeFilters ? (
                  <button className="btn btn-secondary" onClick={() => { setNoticeSearch(""); setNoticeStatus("all"); setNoticeStartDate(""); setNoticeEndDate(""); setAppliedNoticeFilters({ search: "", status: "all", startDate: "", endDate: "" }); setNoticePage(1); }}>
                    초기화
                  </button>
                ) : null}
              </div>

              {!notices?.items.length ? <EmptyState label="조회된 공지가 없습니다." /> : null}
              {notices?.items.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>제목</th>
                        <th>고정</th>
                        <th>게시기간</th>
                        <th>상태</th>
                        <th>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notices.items.map((n) => (
                        <tr key={n.id}>
                          <td>{n.title}</td>
                          <td>{n.pinned ? <span className="badge">고정</span> : "-"}</td>
                          <td>
                            {(n.publishStartAt && new Date(n.publishStartAt).toLocaleDateString()) || "-"} ~ {(n.publishEndAt && new Date(n.publishEndAt).toLocaleDateString()) || "-"}
                          </td>
                          <td>{noticeStatusLabel[n.status]}</td>
                          <td>
                            <div className="admin-actions">
                              <button className="admin-action-btn" onClick={() => void openPreviewNotice(n.id)}>미리보기</button>
                              <button className="admin-action-btn" onClick={() => void openEditNotice(n.id)}>수정</button>
                              <button className="admin-action-btn danger" onClick={() => void removeNotice(n.id)}>삭제</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <Pagination page={notices?.page ?? noticePage} pageSize={PAGE_SIZE} totalCount={notices?.totalCount ?? 0} onPageChange={setNoticePage} />
            </section>
          ) : null}

          {tab === "banners" ? (
            <section className="card admin-section">
              <div className="admin-filters admin-filters-banner">
                <input className="input" placeholder="문구/출처 검색" value={bannerSearch} onChange={(e) => setBannerSearch(e.target.value)} />
                <select className="select" value={bannerActive} onChange={(e) => setBannerActive(e.target.value)}>
                  <option value="all">노출 전체</option>
                  <option value="true">ON</option>
                  <option value="false">OFF</option>
                </select>
                <button className="btn" onClick={() => { setAppliedBannerFilters({ search: bannerSearch, active: bannerActive }); setBannerPage(1); }}>검색</button>
                {hasBannerFilters ? (
                  <button className="btn btn-secondary" onClick={() => { setBannerSearch(""); setBannerActive("all"); setAppliedBannerFilters({ search: "", active: "all" }); setBannerPage(1); }}>
                    초기화
                  </button>
                ) : null}
              </div>

              {!banners?.items.length ? <EmptyState label="조회된 배너가 없습니다." /> : null}
              {banners?.items.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>문구</th>
                        <th>출처</th>
                        <th>우선순위</th>
                        <th>기간</th>
                        <th>상태</th>
                        <th>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {banners.items.map((b) => (
                        <tr key={b.id}>
                          <td>{b.text}</td>
                          <td>{b.source}</td>
                          <td>{b.priority}</td>
                          <td>{b.startAt ? new Date(b.startAt).toLocaleDateString() : "상시"} ~ {b.endAt ? new Date(b.endAt).toLocaleDateString() : "상시"}</td>
                          <td>{b.active ? "ON" : "OFF"}</td>
                          <td>
                            <div className="admin-actions">
                              <button className="admin-action-btn" onClick={() => openEditBanner(b)}>수정</button>
                              <button className="admin-action-btn danger" onClick={() => void removeBanner(b.id)}>삭제</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <Pagination page={banners?.page ?? bannerPage} pageSize={PAGE_SIZE} totalCount={banners?.totalCount ?? 0} onPageChange={setBannerPage} />
            </section>
          ) : null}

          {tab === "users" ? (
            <section className="card admin-section">
              <div className="admin-filters admin-filters-user">
                <input className="input" placeholder="닉네임/이메일" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                <select className="select" value={userStatus} onChange={(e) => setUserStatus(e.target.value)}>
                  <option value="all">전체 상태</option>
                  <option value="active">활성</option>
                  <option value="suspended">정지</option>
                </select>
                <button className="btn" onClick={() => { setAppliedUserFilters({ search: userSearch, status: userStatus }); setUserPage(1); }}>검색</button>
                {hasUserFilters ? (
                  <button className="btn btn-secondary" onClick={() => { setUserSearch(""); setUserStatus("all"); setAppliedUserFilters({ search: "", status: "all" }); setUserPage(1); }}>
                    초기화
                  </button>
                ) : null}
              </div>

              {!users?.items.length ? <EmptyState label="조회된 회원이 없습니다." /> : null}
              {users?.items.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>닉네임</th>
                        <th>이메일</th>
                        <th>권한</th>
                        <th>상태</th>
                        <th>가입일</th>
                        <th>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.items.map((u) => (
                        <tr key={u.id}>
                          <td>{u.displayName ?? "(이름 없음)"}</td>
                          <td>{u.email ?? "이메일 없음"}</td>
                          <td>{u.role}</td>
                          <td>{u.status === "active" || u.status === "suspended" ? userStatusLabel[u.status] : u.status}</td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button className="admin-action-btn" onClick={() => void openUserDetail(u.id)}>상세</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <Pagination page={users?.page ?? userPage} pageSize={PAGE_SIZE} totalCount={users?.totalCount ?? 0} onPageChange={setUserPage} />
            </section>
          ) : null}
        </main>
      </div>

      {noticeEditorOpen ? (
        <Modal title={editingNoticeId ? "공지 수정" : "공지 등록"} onClose={() => setNoticeEditorOpen(false)}>
          <div className="modal-grid">
            <label className="modal-field">
              <span>제목</span>
              <input className="input" placeholder="제목을 입력하세요" value={noticeForm.title} onChange={(e) => setNoticeForm((p) => ({ ...p, title: e.target.value }))} />
            </label>
            <label className="modal-field">
              <span>본문</span>
              <textarea className="textarea" placeholder="본문 내용을 입력하세요" value={noticeForm.body} onChange={(e) => setNoticeForm((p) => ({ ...p, body: e.target.value }))} />
            </label>
            <div className="modal-row">
              <label className="modal-check">
                <input
                  type="checkbox"
                  checked={noticeForm.isDraft}
                  onChange={(e) =>
                    setNoticeForm((p) => ({ ...p, isDraft: e.target.checked }))
                  }
                />
                임시저장
              </label>
              <label className="modal-check"><input type="checkbox" checked={noticeForm.pinned} onChange={(e) => setNoticeForm((p) => ({ ...p, pinned: e.target.checked }))} />고정</label>
            </div>
            <div className="modal-row">
              <label className="modal-field">
                <span>게시 시작일</span>
                <input className="input" type="date" value={noticeForm.publishStartAt} onChange={(e) => setNoticeForm((p) => ({ ...p, publishStartAt: e.target.value }))} />
              </label>
              <label className="modal-field">
                <span>게시 종료일</span>
                <input className="input" type="date" value={noticeForm.publishEndAt} onChange={(e) => setNoticeForm((p) => ({ ...p, publishEndAt: e.target.value }))} />
              </label>
            </div>
            <button className="btn" onClick={() => void saveNotice()} disabled={!noticeForm.title.trim() || !noticeForm.body.trim()}>저장</button>
          </div>
        </Modal>
      ) : null}

      {bannerEditorOpen ? (
        <Modal title={editingBannerId ? "배너 수정" : "배너 등록"} onClose={() => setBannerEditorOpen(false)}>
          <div className="modal-grid">
            <label className="modal-field">
              <span>배너 문구</span>
              <textarea className="textarea" placeholder="노출할 문구를 입력하세요" value={bannerForm.text} onChange={(e) => setBannerForm((p) => ({ ...p, text: e.target.value }))} />
            </label>
            <div className="modal-row">
              <label className="modal-field">
                <span>출처</span>
                <input className="input" placeholder="예: lifeNote" value={bannerForm.source} onChange={(e) => setBannerForm((p) => ({ ...p, source: e.target.value }))} />
              </label>
              <label className="modal-field">
                <span>우선순위</span>
                <input className="input" type="number" placeholder="숫자 입력" value={bannerForm.priority} onChange={(e) => setBannerForm((p) => ({ ...p, priority: Number(e.target.value) }))} />
              </label>
            </div>
            <div className="modal-row">
              <label className="modal-field">
                <span>노출 시작일</span>
                <input className="input" type="date" value={bannerForm.startAt} onChange={(e) => setBannerForm((p) => ({ ...p, startAt: e.target.value }))} />
              </label>
              <label className="modal-field">
                <span>노출 종료일</span>
                <input className="input" type="date" value={bannerForm.endAt} onChange={(e) => setBannerForm((p) => ({ ...p, endAt: e.target.value }))} />
              </label>
            </div>
            <label className="modal-check"><input type="checkbox" checked={bannerForm.active} onChange={(e) => setBannerForm((p) => ({ ...p, active: e.target.checked }))} />활성</label>
            <button className="btn" onClick={() => void saveBanner()} disabled={!bannerForm.text.trim()}>저장</button>
          </div>
        </Modal>
      ) : null}

      {noticePreviewOpen && previewNotice ? (
        <Modal title="공지 미리보기" onClose={() => setNoticePreviewOpen(false)}>
          <div className="modal-grid">
            <div className="modal-info">상태: {noticeStatusLabel[previewNotice.status]}</div>
            <div className="modal-info">기간: {(previewNotice.publishStartAt && new Date(previewNotice.publishStartAt).toLocaleDateString()) || "-"} ~ {(previewNotice.publishEndAt && new Date(previewNotice.publishEndAt).toLocaleDateString()) || "-"}</div>
            <input className="input" value={previewNotice.title} readOnly />
            <textarea className="textarea" value={previewNotice.body ?? ""} readOnly />
          </div>
        </Modal>
      ) : null}

      {userDetailOpen && selectedUser ? (
        <Modal title="회원 상세" onClose={() => setUserDetailOpen(false)}>
          <div className="modal-grid">
            <div className="modal-info">이메일: {selectedUser.email ?? "없음"}</div>
            <div className="modal-info">권한: {selectedUser.role}</div>
            <div className="modal-info">
              상태:{" "}
              {userEditStatus === "active" || userEditStatus === "suspended"
                ? userStatusLabel[userEditStatus]
                : userEditStatus}
            </div>
            <label className="modal-field">
              <span>닉네임</span>
              <input className="input" value={userEditName} onChange={(e) => setUserEditName(e.target.value)} placeholder="닉네임을 입력하세요" />
            </label>
            <label className="modal-field">
              <span>상태</span>
              <select className="select" value={userEditStatus} onChange={(e) => setUserEditStatus(e.target.value as "active" | "suspended")}>
                <option value="active">{userStatusLabel.active}</option>
                <option value="suspended">{userStatusLabel.suspended}</option>
              </select>
            </label>
            <button className="btn" onClick={() => void saveUser()}>저장</button>
          </div>
        </Modal>
      ) : null}
    </AuthGuard>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card card">
        <header className="modal-header">
          <h3>{title}</h3>
          <button className="admin-action-btn" onClick={onClose}>닫기</button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Pagination({ page, pageSize, totalCount, onPageChange }: { page: number; pageSize: number; totalCount: number; onPageChange: (next: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const current = Math.min(page, totalPages);

  return (
    <nav className="admin-pagination" aria-label="페이지네이션">
      <button className="admin-page-btn" onClick={() => onPageChange(Math.max(1, current - 1))} disabled={current <= 1}>
        &lt;
      </button>
      <span className="admin-page-indicator">{current} / {totalPages}</span>
      <button className="admin-page-btn" onClick={() => onPageChange(Math.min(totalPages, current + 1))} disabled={current >= totalPages}>
        &gt;
      </button>
    </nav>
  );
}
