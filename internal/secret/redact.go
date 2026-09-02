package secret

import (
	"regexp"
)

var patterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)postgres(?:ql)?://[^\s]+`),
	regexp.MustCompile(`(?i)github_pat_[A-Za-z0-9_]+`),
	regexp.MustCompile(`(?i)\bgh[pousr]_[A-Za-z0-9]+`),
	regexp.MustCompile(`(?i)sb_(?:secret|publishable)_[^\s]+`),
	regexp.MustCompile(`eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`),
	regexp.MustCompile(`(?i)Bearer\s+\S+`),
}

// Redact strips tokens, JWTs, and database URLs from a log or error string.
func Redact(s string) string {
	out := s
	for _, re := range patterns {
		out = re.ReplaceAllString(out, "[redacted]")
	}
	return out
}

// RedactError returns a new error whose message has secrets stripped.
func RedactError(err error) error {
	if err == nil {
		return nil
	}
	msg := Redact(err.Error())
	if msg == err.Error() {
		return err
	}
	return redactErr{msg: msg}
}

type redactErr struct{ msg string }

func (e redactErr) Error() string { return e.msg }
