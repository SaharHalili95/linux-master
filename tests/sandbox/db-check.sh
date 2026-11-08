#!/usr/bin/env bash
# Runs supabase/migrations against a throwaway Postgres with a small stand-in for Supabase's auth schema,
# and checks that one learner can never read, change or delete another learner's data.
set -euo pipefail
cd "$(dirname "$0")/../.."
name=lm-db-check-$$
trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT
docker run -d --rm --name "$name" -e POSTGRES_PASSWORD=x postgres:16-alpine >/dev/null
until docker exec "$name" pg_isready -q -U postgres; do sleep 1; done; sleep 2
sql() { docker exec -i "$name" psql -q -v ON_ERROR_STOP=1 -U postgres -At "$@"; }
sql <<'SQL'
create role anon nologin; create role authenticated nologin;
create schema auth; grant usage on schema auth to anon, authenticated;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
SQL
sql < supabase/migrations/20261108000000_accounts.sql
A=00000000-0000-0000-0000-00000000000a; B=00000000-0000-0000-0000-00000000000b
sql -c "insert into auth.users values ('$A'), ('$B')"
fails=0
as() { printf "set role %s; set test.uid = '%s'; %s" "$1" "$2" "$3" | sql 2>&1 | tail -1; }
check() { local got; got=$(as "$2" "$3" "$4" || true); if [[ "$got" == $5 ]]; then echo "ok   $1"; else echo "FAIL $1: got [$got], want [$5]"; fails=$((fails+1)); fi; }
check "a row was created for each learner" authenticated "$A" "select count(*) from progress" 1
check "a learner sees only their own learner row" authenticated "$A" "select count(*) from learners" 1
check "a learner saves their own progress" authenticated "$A" "update progress set state='{\"xp\":5}' returning state->>'xp'" 5
check "another learner cannot see it" authenticated "$B" "select count(*) from progress where state->>'xp'='5'" 0
check "another learner cannot change it" authenticated "$B" "with u as (update progress set state='{\"xp\":9}' where state->>'xp'='5' returning 1) select count(*) from u" 0
check "a learner cannot hand their row to someone else" authenticated "$A" "update progress set learner_id=gen_random_uuid()" "*permission denied*"
check "a learner cannot create a row" authenticated "$A" "insert into progress (learner_id) values (gen_random_uuid())" "*permission denied*"
check "a learner cannot delete a row directly" authenticated "$A" "delete from progress" "*permission denied*"
check "anonymous visitors read nothing" anon "" "select count(*) from progress" "*permission denied*"
check "anonymous visitors cannot delete accounts" anon "" "select delete_my_account()" "*permission denied*"
check "oversized progress is refused" authenticated "$A" "update progress set state=jsonb_build_object('x',(select string_agg(md5(i::text),'') from generate_series(1,5000) i))" "*check constraint*"
as authenticated "$A" "select delete_my_account()" >/dev/null
check "deleting removes the account" postgres "" "select count(*) from auth.users where id='$A'" 0
check "deleting removes the learner's data" postgres "" "select (select count(*) from learners)||'/'||(select count(*) from progress)" "1/1"
[ "$fails" = 0 ] && echo "ALL PASSED" || { echo "$fails FAILED"; exit 1; }
