/**
 * DELETE /api/user/delete
 *
 * ログインユーザーのアカウントを完全削除する。
 * 1. user_actress_preferences（スワイプ学習データ）を削除
 * 2. user_video_feedback（フィードバック履歴）を削除
 * 3. user_type_slots（スロット設定）を削除
 * 4. auth.users からユーザーを削除（supabase admin API）
 *
 * Authorization: Bearer <access_token> が必須。
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  // トークンからユーザーIDを取得
  const authedClient = createAuthedClient(token);
  if (!authedClient) {
    return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });
  }

  const { data: { user }, error: userError } = await authedClient.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  // service role クライアントで全データ削除
  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });
  }

  try {
    // 1. スワイプ学習データ
    await serviceClient
      .from('user_actress_preferences')
      .delete()
      .eq('user_id', userId);

    // 2. 動画フィードバック履歴
    await serviceClient
      .from('user_video_feedback')
      .delete()
      .eq('user_id', userId);

    // 3. タイプスロット設定
    await serviceClient
      .from('user_type_slots')
      .delete()
      .eq('user_id', userId);

    // 4. auth ユーザー削除（これで認証情報も消える）
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('[user/delete] auth.admin.deleteUser failed:', deleteError);
      return NextResponse.json({ error: 'ユーザー削除に失敗しました' }, { status: 500 });
    }

    console.log(`[user/delete] user ${userId} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[user/delete] unexpected error:', err);
    return NextResponse.json({ error: '退会処理中にエラーが発生しました' }, { status: 500 });
  }
}
