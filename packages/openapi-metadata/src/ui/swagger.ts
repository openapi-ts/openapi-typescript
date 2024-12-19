export type GenerateSwaggerUIOptions = {
  persistAuthorization?: boolean;
};

/**
 * Generates HTML to display Swagger UI.
 *
 * @see https://swagger.io/tools/swagger-ui/
 */
export function generateSwaggerUI(url: string, options?: GenerateSwaggerUIOptions) {
  const swaggerOptions = {
    url,
    ...options,
  };

  return `<!DOCTYPE html>
		<html lang="en">
		<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="X-UA-Compatible" content="ie=edge">
				<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.3/swagger-ui-standalone-preset.js"></script>
				<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.3/swagger-ui-bundle.js"></script>
				<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.3/swagger-ui.css" />
				<title>Documentation</title>
		</head>
		<body>
				<div id="swagger-ui"></div>
				<script>
						window.onload = function() {
							SwaggerUIBundle({
								url: "${url}",
								dom_id: '#swagger-ui',
								presets: [
									SwaggerUIBundle.presets.apis,
									SwaggerUIStandalonePreset
								],
								layout: "BaseLayout",
                ...${JSON.stringify(swaggerOptions)}
							})
						}
				</script>
		</body>
		</html>`;
}
