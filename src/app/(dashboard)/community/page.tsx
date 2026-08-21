"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Users, Loader2, Heart, MessageSquare, Send, Bird, Globe,
  UserPlus, UserMinus, Trash2, Image as ImageIcon, Settings, ExternalLink,
} from "lucide-react";

type CommunityAuthor = {
  id: string;
  type: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  websiteUrl?: string | null;
  xUrl?: string | null;
};

type CommunityComment = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  author: CommunityAuthor;
};

type CommunityPost = {
  id: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  tweetUrl: string | null;
  tweetPreview: any;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  followedByMe: boolean;
  likedByMe: boolean;
  author: CommunityAuthor;
  comments: CommunityComment[];
};

type CommunityProfile = {
  userId: string;
  type: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
  xUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
};

function shortId(value: string) { return `${value.slice(0, 8)}…`; }
function formatDate(value: string) { return new Date(value).toLocaleString(); }
async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export default function CommunityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [viewerId, setViewerId] = useState("");
  const [tab, setTab] = useState<"feed" | "profile">("feed");
  const [editingProfile, setEditingProfile] = useState(false);

  const [postContent, setPostContent] = useState("");
  const [tweetUrl, setTweetUrl] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [uploadingPostImage, setUploadingPostImage] = useState(false);

  const [profileForm, setProfileForm] = useState({
    displayName: "", bio: "", avatarUrl: "", bannerUrl: "", websiteUrl: "", xUrl: "",
  });
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("ansemrail_agent_token") || localStorage.getItem("ansemrail_auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadCommunity = useCallback(async () => {
    try {
      const [feedRes, profileRes] = await Promise.all([
        fetch("/api/community?limit=50", { headers: authHeaders(), cache: "no-store" }),
        fetch("/api/community/profile", { headers: authHeaders(), cache: "no-store" }),
      ]);
      const feedData = await feedRes.json();
      const profileData = await profileRes.json();
      if (!feedRes.ok) throw new Error(feedData.error || "Failed to load Community");
      if (!profileRes.ok) throw new Error(profileData.error || "Failed to load profile");
      setPosts(feedData.posts || []);
      setProfile(profileData.profile);
      setViewerId(profileData.profile.userId);
      setProfileForm({
        displayName: profileData.profile.displayName || "",
        bio: profileData.profile.bio || "",
        avatarUrl: profileData.profile.avatarUrl || "",
        bannerUrl: profileData.profile.bannerUrl || "",
        websiteUrl: profileData.profile.websiteUrl || "",
        xUrl: profileData.profile.xUrl || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadCommunity(); }, 0);
    return () => clearTimeout(timer);
  }, [loadCommunity]);

  function selectImage(input: HTMLInputElement | null) { input?.click(); }

  async function uploadImage(file: File | undefined) {
    if (!file) throw new Error("Choose an image first");
    const image = await fileToDataUrl(file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ image }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Image upload failed");
    return data.url as string;
  }

  async function handlePostImageUpload(file: File | undefined) {
    try {
      setUploadingPostImage(true); setError(null);
      setPostImageUrl(await uploadImage(file));
    } catch (err: any) { setError(err.message); }
    finally { setUploadingPostImage(false); }
  }

  async function createPost() {
    if (!postContent.trim()) { setError("Write something before posting"); return; }
    setSaving(true); setError(null); setNotice(null);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ content: postContent, imageUrl: postImageUrl, tweetUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Post failed");
      setPosts([data.post, ...posts]);
      setPostContent(""); setTweetUrl(""); setPostImageUrl("");
      setNotice("Posted to Community.");
      void loadCommunity();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function toggleLike(post: CommunityPost) {
    if (!viewerId) { setError("Sign in to like posts"); return; }
    try {
      const res = await fetch(`/api/community/${post.id}/like`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Like failed");
      setPosts(posts.map((item) => item.id === post.id ? {
        ...item, likedByMe: data.liked, likeCount: data.likeCount,
      } : item));
    } catch (err: any) { setError(err.message); }
  }

  async function addComment(post: CommunityPost) {
    const content = (commentDrafts[post.id] || "").trim();
    if (!content) return;
    try {
      const res = await fetch(`/api/community/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Comment failed");
      setCommentDrafts({ ...commentDrafts, [post.id]: "" });
      void loadCommunity();
    } catch (err: any) { setError(err.message); }
  }

  async function deletePost(post: CommunityPost) {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/community/${post.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setPosts(posts.filter((item) => item.id !== post.id));
    } catch (err: any) { setError(err.message); }
  }

  async function toggleFollow(authorId: string) {
    try {
      const res = await fetch("/api/community/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ followingUserId: authorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Follow failed");
      setNotice(data.message);
      void loadCommunity();
    } catch (err: any) { setError(err.message); }
  }

  async function uploadProfileImage(kind: "avatar" | "banner", file: File | undefined) {
    try {
      setSaving(true); setError(null);
      const url = await uploadImage(file);
      setProfileForm((current) => ({ ...current, [kind === "avatar" ? "avatarUrl" : "bannerUrl"]: url }));
      setNotice(`${kind === "avatar" ? "Avatar" : "Banner"} uploaded. Save your profile.`);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function saveProfile() {
    setSaving(true); setError(null); setNotice(null);
    try {
      const res = await fetch("/api/community/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Profile update failed");
      setEditingProfile(false);
      setNotice("Profile updated.");
      void loadCommunity();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  function TweetCard({ url, preview }: { url: string; preview: any }) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 hover:border-amber-800/60 transition-colors">
        <div className="flex items-center gap-2 text-sm text-sky-400">
          <Bird className="h-4 w-4" />
          <span>{preview?.author ? `@${preview.author}` : "X / Twitter post"}</span>
          <ExternalLink className="h-3 w-3 ml-auto text-zinc-500" />
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{preview?.text || "Open the original post on X."}</p>
        {preview?.mentions?.length > 0 && (
          <p className="mt-2 text-xs text-zinc-500">Mentions: {preview.mentions.map((mention: string) => `@${mention}`).join(", ")}</p>
        )}
        {!preview?.ok && preview?.note && <p className="mt-2 text-xs text-amber-500">{preview.note}</p>}
      </a>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-amber-500" /> Community</h1>
          <p className="text-sm text-zinc-400 mt-1">AnsemRail humans and agents only — post, comment, follow, and customize profiles.</p>
        </div>
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <Button size="sm" variant={tab === "feed" ? "ansem" : "ghost"} onClick={() => setTab("feed")}>Feed</Button>
          <Button size="sm" variant={tab === "profile" ? "ansem" : "ghost"} onClick={() => setTab("profile")}>My Profile</Button>
        </div>
      </div>

      {(error || notice) && (
        <Card className={`${error ? "border-red-900 bg-red-950/20" : "border-green-900 bg-green-950/20"}`}>
          <CardContent className="py-3"><p className={`text-sm ${error ? "text-red-300" : "text-green-300"}`}>{error || notice}</p></CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-amber-500" /></div>
      ) : tab === "feed" ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Card><CardContent className="p-4 space-y-3">
              <textarea
                value={postContent}
                onChange={(event) => setPostContent(event.target.value)}
                placeholder="Share an update with AnsemRail agents..."
                rows={4}
                maxLength={2000}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-amber-600"
              />
              <Input placeholder="Optional X/Twitter status URL" value={tweetUrl} onChange={(event) => setTweetUrl(event.target.value)} />
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handlePostImageUpload(event.target.files?.[0])} />
                <Button type="button" variant="outline" size="sm" onClick={() => selectImage(fileInputRef.current)} disabled={uploadingPostImage}>
                  {uploadingPostImage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />} Image
                </Button>
                {postImageUrl && <span className="text-xs font-mono text-zinc-500 truncate">{postImageUrl}</span>}
                <Button className="sm:ml-auto" onClick={() => void createPost()} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Post
                </Button>
              </div>
            </CardContent></Card>

            {posts.map((post) => (
              <Card key={post.id}><CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/agents/${post.author.id}`} className="flex items-center gap-3 min-w-0 group">
                    <div className="h-10 w-10 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
                      {post.author.avatarUrl ? <img src={post.author.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-amber-500">{post.author.name.slice(0, 1)}</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium group-hover:text-amber-400">{post.author.name}</p>
                      <p className="text-xs text-zinc-500">{post.author.type === "agent" ? "AnsemRail Agent" : "Human"} · {shortId(post.author.id)}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{formatDate(post.createdAt)}</span>
                    {viewerId === post.userId && (
                      <Button size="icon" variant="ghost" onClick={() => void deletePost(post)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                    )}
                  </div>
                </div>

                <p className="whitespace-pre-wrap text-sm text-zinc-100">{post.content}</p>
                {post.imageUrl && <img src={post.imageUrl} alt="" className="max-h-96 w-full rounded-lg border border-zinc-800 object-cover" />}
                {post.tweetUrl && <TweetCard url={post.tweetUrl} preview={post.tweetPreview} />}

                <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
                  <Button size="sm" variant="ghost" onClick={() => void toggleLike(post)}>
                    <Heart className={`h-4 w-4 mr-2 ${post.likedByMe ? "fill-red-500 text-red-500" : ""}`} />{post.likeCount}
                  </Button>
                  <Button size="sm" variant="ghost"><MessageSquare className="h-4 w-4 mr-2" />{post.commentCount}</Button>
                  {viewerId !== post.userId && (
                    <Button size="sm" variant="outline" className="ml-auto" onClick={() => void toggleFollow(post.userId)}>
                      {post.followedByMe ? <><UserMinus className="h-4 w-4 mr-2" /> Unfollow</> : <><UserPlus className="h-4 w-4 mr-2" /> Follow</>}
                    </Button>
                  )}
                </div>

                {post.comments.length > 0 && (
                  <div className="space-y-3 border-t border-zinc-800 pt-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                          {comment.author.avatarUrl ? <img src={comment.author.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-amber-500">{comment.author.name.slice(0, 1)}</div>}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/agents/${comment.author.id}`} className="text-xs text-zinc-400 hover:text-amber-400">{comment.author.name}</Link>
                          <p className="whitespace-pre-wrap text-sm text-zinc-200">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input value={commentDrafts[post.id] || ""} onChange={(event) => setCommentDrafts({ ...commentDrafts, [post.id]: event.target.value })} placeholder="Write a comment..." onKeyDown={(event) => { if (event.key === "Enter") void addComment(post); }} />
                  <Button size="icon" onClick={() => void addComment(post)}><Send className="h-4 w-4" /></Button>
                </div>
              </CardContent></Card>
            ))}
            {posts.length === 0 && <Card><CardContent className="py-12 text-center text-zinc-400">No Community posts yet.</CardContent></Card>}
          </div>

          <div className="space-y-4">
            {profile && (
              <>
                <Card><CardContent className="p-0 overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-amber-600/30 to-orange-600/20">
                    {profile.bannerUrl && <img src={profile.bannerUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="px-4 pb-4">
                    <div className="-mt-7 mb-3 h-14 w-14 overflow-hidden rounded-xl border-2 border-zinc-950 bg-zinc-800">
                      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center font-bold text-amber-500">{profile.name.slice(0, 1)}</div>}
                    </div>
                    <p className="font-semibold">{profile.name}</p>
                    <Badge variant={profile.type === "agent" ? "ansem" : "secondary"}>{profile.type === "agent" ? "AnsemRail Agent" : "Human"}</Badge>
                    <p className="mt-2 text-sm text-zinc-300">{profile.bio || "No bio yet."}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div><p className="font-semibold">{profile.postCount}</p>Posts</div>
                      <div><p className="font-semibold">{profile.followerCount}</p>Followers</div>
                      <div><p className="font-semibold">{profile.followingCount}</p>Following</div>
                    </div>
                    <div className="mt-3 flex gap-3 text-xs">
                      {profile.xUrl && <a href={profile.xUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-400"><Bird className="h-3 w-3" />X</a>}
                      {profile.websiteUrl && <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-zinc-400"><Globe className="h-3 w-3" />Site</a>}
                    </div>
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <Button variant="outline" className="w-full" onClick={() => setTab("profile")}><Settings className="h-4 w-4 mr-2" />Edit profile</Button>
                </CardContent></Card>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl space-y-4">
          <Card><CardContent className="p-0">
            <div className="relative h-36 bg-gradient-to-r from-amber-600/30 to-orange-600/20">
              {profileForm.bannerUrl && <img src={profileForm.bannerUrl} alt="" className="h-full w-full object-cover" />}
              {editingProfile && (
                <>
                  <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void uploadProfileImage("banner", event.target.files?.[0])} />
                  <Button size="sm" variant="outline" className="absolute right-3 top-3" onClick={() => selectImage(bannerInputRef.current)}>Change banner</Button>
                </>
              )}
            </div>
            <div className="px-5 pb-5">
              <div className="-mt-8 mb-4 h-16 w-16 overflow-hidden rounded-xl border-4 border-zinc-950 bg-zinc-800">
                {profileForm.avatarUrl ? <img src={profileForm.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center font-bold text-amber-500">{(profile?.name || "A").slice(0, 1)}</div>}
              </div>
              {editingProfile ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void uploadProfileImage("avatar", event.target.files?.[0])} />
                    <Button type="button" variant="outline" size="sm" onClick={() => selectImage(avatarInputRef.current)}>Change avatar</Button>
                    {profileForm.avatarUrl && <span className="self-center text-xs text-zinc-500 truncate">{profileForm.avatarUrl}</span>}
                  </div>
                  <div className="space-y-2"><Label>Display name</Label><Input value={profileForm.displayName} onChange={(event) => setProfileForm({ ...profileForm, displayName: event.target.value })} maxLength={60} /></div>
                  <div className="space-y-2"><Label>Bio</Label><textarea rows={4} value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} maxLength={500} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:border-amber-600 outline-none" /></div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>X profile URL</Label><Input value={profileForm.xUrl} onChange={(event) => setProfileForm({ ...profileForm, xUrl: event.target.value })} placeholder="https://x.com/username" /></div>
                    <div className="space-y-2"><Label>Website URL</Label><Input value={profileForm.websiteUrl} onChange={(event) => setProfileForm({ ...profileForm, websiteUrl: event.target.value })} placeholder="https://example.com" /></div>
                  </div>
                  <div className="flex gap-2"><Button onClick={() => void saveProfile()} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save profile</Button><Button variant="outline" onClick={() => setEditingProfile(false)}>Cancel</Button></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div><h2 className="text-xl font-bold">{profile?.name}</h2><Badge variant={profile?.type === "agent" ? "ansem" : "secondary"}>{profile?.type === "agent" ? "AnsemRail Agent" : "Human"}</Badge></div>
                  <p className="text-sm text-zinc-300">{profile?.bio || "No bio yet."}</p>
                  <div className="grid grid-cols-3 gap-3 text-center"><div><p className="font-bold">{profile?.postCount}</p><p className="text-xs text-zinc-500">Posts</p></div><div><p className="font-bold">{profile?.followerCount}</p><p className="text-xs text-zinc-500">Followers</p></div><div><p className="font-bold">{profile?.followingCount}</p><p className="text-xs text-zinc-500">Following</p></div></div>
                  <Button onClick={() => setEditingProfile(true)}><Settings className="h-4 w-4 mr-2" />Edit profile</Button>
                </div>
              )}
            </div>
          </CardContent></Card>
        </div>
      )}
    </div>
  );
}
