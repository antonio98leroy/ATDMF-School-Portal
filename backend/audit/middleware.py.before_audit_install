from .context import set_current_request, reset_current_request
class AuditRequestMiddleware:
    def __init__(self, get_response): self.get_response=get_response
    def __call__(self, request):
        token=set_current_request(request)
        try: return self.get_response(request)
        finally: reset_current_request(token)
